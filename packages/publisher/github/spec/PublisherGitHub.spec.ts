import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { ForgeArch, ForgeMakeResult } from '@electron-forge/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublisherGitHub } from '../src/PublisherGitHub';
import { rewriteReleasesForArch } from '../src/util/squirrel-arch';

import type { PublisherOptions } from '@electron-forge/publisher-base';

const { mockOctokit } = vi.hoisted(() => ({
  mockOctokit: {
    repos: {
      listReleases: vi.fn(),
      createRelease: vi.fn(),
      uploadReleaseAsset: vi.fn(),
      deleteReleaseAsset: vi.fn(),
    },
  },
}));

vi.mock('../src/util/github', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../src/util/github')>();
  class MockGitHub extends mod.default {
    getGitHub() {
      return mockOctokit as unknown as ReturnType<
        InstanceType<typeof mod.default>['getGitHub']
      >;
    }
  }
  return { ...mod, default: MockGitHub };
});

describe('PublisherGitHub', () => {
  let tmpDir: string;

  const makeResultFor = async (
    artifactName: string,
  ): Promise<ForgeMakeResult> => {
    const artifactPath = path.resolve(tmpDir, artifactName);
    await fs.writeFile(artifactPath, 'fake-artifact');
    return {
      artifacts: [artifactPath],
      packageJSON: { version: '1.0.0' },
      platform: 'darwin',
      arch: 'x64',
    };
  };

  const publishFor = async (
    publisher: PublisherGitHub,
    artifactName: string,
  ) => {
    await publishResults(publisher, [await makeResultFor(artifactName)]);
  };

  const publishResults = async (
    publisher: PublisherGitHub,
    makeResults: ForgeMakeResult[],
  ) => {
    await publisher.publish({
      dir: tmpDir,
      makeResults,
      setStatusLine: vi.fn(),
    } as unknown as PublisherOptions);
  };

  const FULL_SHA = 'a'.repeat(40);
  const DELTA_SHA = 'b'.repeat(40);
  const RELEASES_CONTENT = [
    `${FULL_SHA} my_app-1.0.0-full.nupkg 1000`,
    `${DELTA_SHA} my_app-1.0.0-delta.nupkg 200`,
    '',
  ].join('\n');

  // Mirrors what the Squirrel.Windows maker produces: identical file names for
  // every arch, written to a per-arch output directory
  const squirrelResultFor = async (
    arch: ForgeArch,
  ): Promise<ForgeMakeResult> => {
    const outDir = path.resolve(tmpDir, 'squirrel.windows', arch);
    await fs.mkdir(outDir, { recursive: true });
    const files: Record<string, string> = {
      RELEASES: RELEASES_CONTENT,
      [`MyApp-1.0.0-win32-${arch} Setup.exe`]: 'fake-setup',
      'my_app-1.0.0-full.nupkg': 'fake-full',
      'my_app-1.0.0-delta.nupkg': 'fake-delta',
    };
    const artifacts: string[] = [];
    for (const [name, contents] of Object.entries(files)) {
      const artifactPath = path.resolve(outDir, name);
      await fs.writeFile(artifactPath, contents);
      artifacts.push(artifactPath);
    }
    return {
      artifacts,
      packageJSON: { version: '1.0.0' },
      platform: 'win32',
      arch,
    };
  };

  const uploadedAssets = () =>
    mockOctokit.repos.uploadReleaseAsset.mock.calls.map(([args]) => args);

  const uploadedNames = () => uploadedAssets().map((args) => args.name);

  const isStreamBody = (data: unknown) =>
    !Buffer.isBuffer(data) &&
    typeof (data as ReadableStream).getReader === 'function';

  const newPublisher = () =>
    new PublisherGitHub({
      repository: { owner: 'my-owner', name: 'my-repo' },
      draft: true,
      authToken: 'fake-token',
    });

  beforeEach(async () => {
    // Ensure the spec does not depend on ambient credentials — CI runners
    // have no GITHUB_TOKEN, so the publisher must rely on config.authToken
    vi.stubEnv('GITHUB_TOKEN', '');
    tmpDir = await fs.mkdtemp(
      path.resolve(os.tmpdir(), 'forge-publisher-github-'),
    );
    // Simulate GitHub's eventually consistent "list releases" API by never
    // returning the release created moments earlier in the same process
    mockOctokit.repos.listReleases.mockResolvedValue({ data: [] });
    mockOctokit.repos.createRelease.mockResolvedValue({
      data: {
        id: 123,
        tag_name: 'v1.0.0',
        upload_url: 'https://example.com/upload',
        assets: [],
      },
    });
    mockOctokit.repos.uploadReleaseAsset.mockImplementation(
      async ({ name }: { name: string }) => ({ data: { name } }),
    );
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('does not create a duplicate release when publishing multiple dry runs for the same version', async () => {
    const publisher = new PublisherGitHub({
      repository: { owner: 'my-owner', name: 'my-repo' },
      draft: true,
      authToken: 'fake-token',
    });

    await publishFor(publisher, 'app-1.0.0-darwin.zip');
    await publishFor(publisher, 'app-1.0.0-win32.zip');

    expect(mockOctokit.repos.createRelease).toHaveBeenCalledOnce();
    expect(mockOctokit.repos.uploadReleaseAsset).toHaveBeenCalledTimes(2);
    for (const [args] of mockOctokit.repos.uploadReleaseAsset.mock.calls) {
      expect(args.release_id).toEqual(123);
    }
  });

  describe('Squirrel.Windows assets', () => {
    it('keeps asset names unchanged when publishing a single Windows arch', async () => {
      await publishResults(newPublisher(), [await squirrelResultFor('arm64')]);

      expect(uploadedNames().sort()).toEqual(
        [
          'RELEASES',
          'MyApp-1.0.0-win32-arm64 Setup.exe',
          'my_app-1.0.0-full.nupkg',
          'my_app-1.0.0-delta.nupkg',
        ].sort(),
      );
      const releases = uploadedAssets().find(
        (args) => args.name === 'RELEASES',
      );
      expect(isStreamBody(releases.data)).toBe(true);
      expect(releases.headers['content-length']).toEqual(
        Buffer.byteLength(RELEASES_CONTENT),
      );
    });

    it('prefixes non-x64 RELEASES and nupkg assets when publishing x64 and arm64 together', async () => {
      await publishResults(newPublisher(), [
        await squirrelResultFor('x64'),
        await squirrelResultFor('arm64'),
      ]);

      expect(uploadedNames().sort()).toEqual(
        [
          // x64 keeps the bare names
          'RELEASES',
          'MyApp-1.0.0-win32-x64 Setup.exe',
          'my_app-1.0.0-full.nupkg',
          'my_app-1.0.0-delta.nupkg',
          // arm64 RELEASES and nupkgs are prefixed, Setup.exe is not
          'arm64.RELEASES',
          'MyApp-1.0.0-win32-arm64 Setup.exe',
          'arm64.my_app-1.0.0-full.nupkg',
          'arm64.my_app-1.0.0-delta.nupkg',
        ].sort(),
      );

      const x64Releases = uploadedAssets().find(
        (args) => args.name === 'RELEASES',
      );
      expect(isStreamBody(x64Releases.data)).toBe(true);
      expect(x64Releases.headers['content-length']).toEqual(
        Buffer.byteLength(RELEASES_CONTENT),
      );

      const arm64Releases = uploadedAssets().find(
        (args) => args.name === 'arm64.RELEASES',
      );
      expect(Buffer.isBuffer(arm64Releases.data)).toBe(true);
      expect(arm64Releases.data.toString('utf8')).toEqual(
        [
          `${FULL_SHA} arm64.my_app-1.0.0-full.nupkg 1000`,
          `${DELTA_SHA} arm64.my_app-1.0.0-delta.nupkg 200`,
          '',
        ].join('\n'),
      );
      expect(arm64Releases.headers['content-length']).toEqual(
        arm64Releases.data.byteLength,
      );

      // The nupkg files themselves are streamed from disk under the new name
      const arm64Full = uploadedAssets().find(
        (args) => args.name === 'arm64.my_app-1.0.0-full.nupkg',
      );
      expect(isStreamBody(arm64Full.data)).toBe(true);
      expect(arm64Full.headers['content-length']).toEqual(
        Buffer.byteLength('fake-full'),
      );
    });

    it('prefixes every arch when publishing multiple non-x64 arches', async () => {
      await publishResults(newPublisher(), [
        await squirrelResultFor('arm64'),
        await squirrelResultFor('ia32'),
      ]);

      expect(uploadedNames().sort()).toEqual(
        [
          'arm64.RELEASES',
          'MyApp-1.0.0-win32-arm64 Setup.exe',
          'arm64.my_app-1.0.0-full.nupkg',
          'arm64.my_app-1.0.0-delta.nupkg',
          'ia32.RELEASES',
          'MyApp-1.0.0-win32-ia32 Setup.exe',
          'ia32.my_app-1.0.0-full.nupkg',
          'ia32.my_app-1.0.0-delta.nupkg',
        ].sort(),
      );
      for (const arch of ['arm64', 'ia32']) {
        const releases = uploadedAssets().find(
          (args) => args.name === `${arch}.RELEASES`,
        );
        expect(releases.data.toString('utf8')).toContain(
          `${arch}.my_app-1.0.0-full.nupkg`,
        );
      }
    });

    it('does not prefix Windows results without a RELEASES file', async () => {
      const zipResult = await makeResultFor('app-1.0.0-win32-arm64.zip');
      zipResult.platform = 'win32';
      zipResult.arch = 'arm64';

      await publishResults(newPublisher(), [
        await squirrelResultFor('x64'),
        zipResult,
      ]);

      expect(uploadedNames().sort()).toEqual(
        [
          'RELEASES',
          'MyApp-1.0.0-win32-x64 Setup.exe',
          'my_app-1.0.0-full.nupkg',
          'my_app-1.0.0-delta.nupkg',
          'app-1.0.0-win32-arm64.zip',
        ].sort(),
      );
    });
  });

  describe('rewriteReleasesForArch', () => {
    it('prefixes the nupkg name in a single entry', () => {
      expect(
        rewriteReleasesForArch(
          `${FULL_SHA} my_app-1.0.0-full.nupkg 1000`,
          'arm64',
        ),
      ).toEqual(`${FULL_SHA} arm64.my_app-1.0.0-full.nupkg 1000`);
    });

    it('prefixes both full and delta entries and keeps the trailing newline', () => {
      expect(rewriteReleasesForArch(RELEASES_CONTENT, 'arm64')).toEqual(
        [
          `${FULL_SHA} arm64.my_app-1.0.0-full.nupkg 1000`,
          `${DELTA_SHA} arm64.my_app-1.0.0-delta.nupkg 200`,
          '',
        ].join('\n'),
      );
    });

    it('preserves CRLF line endings and blank lines', () => {
      const input = [
        `${FULL_SHA} my_app-1.0.0-full.nupkg 1000`,
        '',
        `${DELTA_SHA} my_app-1.0.0-delta.nupkg 200`,
        '',
      ].join('\r\n');
      expect(rewriteReleasesForArch(input, 'ia32')).toEqual(
        [
          `${FULL_SHA} ia32.my_app-1.0.0-full.nupkg 1000`,
          '',
          `${DELTA_SHA} ia32.my_app-1.0.0-delta.nupkg 200`,
          '',
        ].join('\r\n'),
      );
    });

    it('preserves a staging percentage suffix', () => {
      expect(
        rewriteReleasesForArch(
          `${FULL_SHA} my_app-1.0.0-full.nupkg 1000 # 25%`,
          'arm64',
        ),
      ).toEqual(`${FULL_SHA} arm64.my_app-1.0.0-full.nupkg 1000 # 25%`);
    });

    it('prefixes only the file name of an absolute URL', () => {
      expect(
        rewriteReleasesForArch(
          `${FULL_SHA} https://example.com/releases/download/v1.0.0/my_app-1.0.0-full.nupkg 1000`,
          'arm64',
        ),
      ).toEqual(
        `${FULL_SHA} https://example.com/releases/download/v1.0.0/arm64.my_app-1.0.0-full.nupkg 1000`,
      );
    });

    it('does not prefix an already prefixed nupkg', () => {
      const input = `${FULL_SHA} arm64.my_app-1.0.0-full.nupkg 1000`;
      expect(rewriteReleasesForArch(input, 'arm64')).toEqual(input);
      expect(
        rewriteReleasesForArch(
          rewriteReleasesForArch(RELEASES_CONTENT, 'arm64'),
          'arm64',
        ),
      ).toEqual(rewriteReleasesForArch(RELEASES_CONTENT, 'arm64'));
    });

    it('leaves comments and non-entry lines untouched', () => {
      const input = [
        '# this is a comment mentioning my_app-1.0.0-full.nupkg',
        'not a release entry',
        `${FULL_SHA} my_app-1.0.0-full.nupkg 1000`,
      ].join('\n');
      expect(rewriteReleasesForArch(input, 'arm64')).toEqual(
        [
          '# this is a comment mentioning my_app-1.0.0-full.nupkg',
          'not a release entry',
          `${FULL_SHA} arm64.my_app-1.0.0-full.nupkg 1000`,
        ].join('\n'),
      );
    });
  });

  describe('existing assets', () => {
    it('skips an asset that already exists on the release and warns about it', async () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      mockOctokit.repos.createRelease.mockResolvedValue({
        data: {
          id: 123,
          tag_name: 'v1.0.0',
          upload_url: 'https://example.com/upload',
          assets: [{ id: 1, name: 'app-1.0.0-darwin.zip' }],
        },
      });

      await publishFor(newPublisher(), 'app-1.0.0-darwin.zip');

      expect(mockOctokit.repos.uploadReleaseAsset).not.toHaveBeenCalled();
      expect(mockOctokit.repos.deleteReleaseAsset).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledOnce();
      const message = warn.mock.calls[0].join(' ');
      expect(message).toContain("'app-1.0.0-darwin.zip'");
      expect(message).toContain('force: true');
    });

    it('replaces an existing asset without warning when force is set', async () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      mockOctokit.repos.createRelease.mockResolvedValue({
        data: {
          id: 123,
          tag_name: 'v1.0.0',
          upload_url: 'https://example.com/upload',
          assets: [{ id: 1, name: 'app-1.0.0-darwin.zip' }],
        },
      });
      const publisher = new PublisherGitHub({
        repository: { owner: 'my-owner', name: 'my-repo' },
        authToken: 'fake-token',
        force: true,
      });

      await publishFor(publisher, 'app-1.0.0-darwin.zip');

      expect(mockOctokit.repos.deleteReleaseAsset).toHaveBeenCalledWith(
        expect.objectContaining({ asset_id: 1 }),
      );
      expect(uploadedNames()).toEqual(['app-1.0.0-darwin.zip']);
      expect(warn).not.toHaveBeenCalled();
    });
  });
});

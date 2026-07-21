import os from 'node:os';
import path from 'node:path';

import { ForgeMakeResult } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublisherGithub } from '../src/PublisherGithub';

import type { PublisherOptions } from '@electron-forge/publisher-base';

const { mockOctokit } = vi.hoisted(() => ({
  mockOctokit: {
    repos: {
      listReleases: vi.fn(),
      createRelease: vi.fn(),
      uploadReleaseAsset: vi.fn(),
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

describe('PublisherGithub', () => {
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
    publisher: PublisherGithub,
    artifactName: string,
  ) => {
    await publisher.publish({
      dir: tmpDir,
      makeResults: [await makeResultFor(artifactName)],
      setStatusLine: vi.fn(),
    } as unknown as PublisherOptions);
  };

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
    await fs.remove(tmpDir);
  });

  it('does not create a duplicate release when publishing multiple dry runs for the same version', async () => {
    const publisher = new PublisherGithub({
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
});

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { writeJson } from '@electron-forge/core-utils';
import { ForgeArch } from '@electron-forge/shared-types';
import { spawn } from '@malept/cross-spawn-promise';
import { zip } from 'cross-zip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MakerZIP, MakerZIPConfig } from '../src/MakerZIP';

const { FAKE_ZIP_CONTENTS } = vi.hoisted(() => ({
  FAKE_ZIP_CONTENTS: 'fake zip contents',
}));
const FAKE_ZIP_SHA256 = createHash('sha256')
  .update(FAKE_ZIP_CONTENTS)
  .digest('hex');
const FAKE_ZIP_SIZE = Buffer.byteLength(FAKE_ZIP_CONTENTS);

const sha256 = (data: string) =>
  createHash('sha256').update(data).digest('hex');

vi.mock(import('cross-zip'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    // We pass the cross-zip functions through util.promisify, so we need to implement
    // a dummy callback call so that the promise resolves.
    zip: vi.fn().mockImplementation((_in, out, callback) => {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, FAKE_ZIP_CONTENTS);
      callback();
    }),
  };
});

vi.mock(import('@malept/cross-spawn-promise'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    spawn: vi.fn(),
  };
});

vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    writeJson: vi.fn(),
  };
});

describe('MakerZip', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const dir = path.resolve(import.meta.dirname, 'fixture', 'fake-app');
  const darwinDir = path.resolve(
    import.meta.dirname,
    'fixture',
    'fake-darwin-app',
  );
  const makeDir = path.resolve(os.tmpdir(), 'forge-zip-test');
  const appName = 'My Test App';
  const targetArch = process.arch as ForgeArch;
  const packageJSON = { version: '1.2.3' };

  it.each([['win32', 'linux'] as const])(
    `should generate a zip file for a %s app`,
    async (platform) => {
      const maker = new MakerZIP({}, []);
      maker.ensureFile = vi.fn();
      const output = await maker.make({
        dir,
        makeDir,
        appName,
        targetArch,
        targetPlatform: platform,
        packageJSON,
        forgeConfig: null as any,
      });

      expect(output).toHaveLength(1);
      expect(zip).toHaveBeenCalledOnce();
      expect(zip).toHaveBeenCalledWith(
        dir,
        path.join(makeDir, 'zip', platform, targetArch, 'fake-app-1.2.3.zip'),
        expect.anything(),
      );
    },
  );

  it.each([['darwin', 'mas'] as const])(
    `should generate a zip file for a %s app`,
    async (platform) => {
      const maker = new MakerZIP(
        {
          macUpdateManifestBaseUrl: undefined,
        },
        [],
      );
      maker.prepareConfig(targetArch);
      maker.ensureFile = vi.fn();
      const output = await maker.make({
        dir: darwinDir,
        makeDir,
        appName,
        targetArch,
        targetPlatform: platform,
        packageJSON,
        forgeConfig: null as any,
      });

      expect(output).toHaveLength(1);
      expect(zip).toHaveBeenCalledOnce();
      expect(zip).toHaveBeenCalledWith(
        path.join(darwinDir, 'My Test App.app'),
        path.join(
          makeDir,
          'zip',
          platform,
          targetArch,
          'fake-darwin-app-1.2.3.zip',
        ),
        expect.anything(),
      );
    },
  );

  describe('macUpdateManifestBaseUrl', () => {
    it.each([['win32', 'mas', 'linux'] as const])(
      'should not make a network request on $platform',
      async (platform) => {
        const maker = new MakerZIP(
          {
            macUpdateManifestBaseUrl: 'https://electronjs.org',
          },
          [],
        );
        maker.prepareConfig(targetArch);
        maker.ensureFile = vi.fn();
        const output = await maker.make({
          dir: darwinDir,
          makeDir,
          appName,
          targetArch,
          targetPlatform: platform,
          packageJSON,
          forgeConfig: null as any,
        });

        expect(output).toHaveLength(1);
        expect(mockFetch).not.toHaveBeenCalled();
      },
    );

    describe('when making for the darwin platform', () => {
      it('should fetch the current RELEASES.json and write it to disk', async () => {
        const maker = new MakerZIP(
          {
            macUpdateManifestBaseUrl: 'fake://test/foo',
          },
          [],
        );
        maker.prepareConfig(targetArch);
        maker.ensureFile = vi.fn();
        mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));
        await maker.make({
          dir: darwinDir,
          makeDir,
          appName,
          targetArch,
          targetPlatform: 'darwin',
          packageJSON,
          forgeConfig: null as any,
        });

        expect(mockFetch).toHaveBeenCalledOnce();
        expect(writeJson).toHaveBeenCalledWith(expect.anything(), {
          currentRelease: '1.2.3',
          releases: [
            {
              updateTo: {
                name: 'My Test App v1.2.3',
                notes: '',
                pub_date: expect.anything(),
                url: 'fake://test/foo/fake-darwin-app-1.2.3.zip',
                version: '1.2.3',
                sha256: FAKE_ZIP_SHA256,
                size: FAKE_ZIP_SIZE,
              },
              version: '1.2.3',
            },
          ],
        });
      });

      it('should generate a valid RELEASES.json manifest with no current file', async () => {
        const maker = new MakerZIP(
          {
            macUpdateManifestBaseUrl: 'fake://test/foo',
          },
          [],
        );
        maker.prepareConfig(targetArch);
        maker.ensureFile = vi.fn();
        mockFetch.mockResolvedValue(new Response(null, { status: 404 }));
        await maker.make({
          dir: darwinDir,
          makeDir,
          appName,
          targetArch,
          targetPlatform: 'darwin',
          packageJSON,
          forgeConfig: null as any,
        });

        expect(mockFetch).toHaveBeenCalledOnce();
        expect(writeJson).toHaveBeenCalledWith(expect.anything(), {
          currentRelease: '1.2.3',
          releases: [
            {
              updateTo: {
                name: 'My Test App v1.2.3',
                notes: '',
                pub_date: expect.anything(),
                url: 'fake://test/foo/fake-darwin-app-1.2.3.zip',
                version: '1.2.3',
                sha256: FAKE_ZIP_SHA256,
                size: FAKE_ZIP_SIZE,
              },
              version: '1.2.3',
            },
          ],
        });
      });

      it('should extend the current RELEASES.json manifest if it exists', async () => {
        const maker = new MakerZIP(
          {
            macUpdateManifestBaseUrl: 'fake://test/foo',
            macUpdateReleaseNotes: 'my-notes',
          },
          [],
        );
        maker.prepareConfig(targetArch);
        maker.ensureFile = vi.fn();
        const oneOneOneRelease = {
          version: '1.1.1',
          updateTo: {
            version: '1.1.1',
            name: 'Fun 1.1.1 Release',
            url: 'fake://test/bar',
          },
        };
        mockFetch.mockResolvedValue(
          new Response(
            JSON.stringify({
              currentRelease: '1.1.1',
              releases: [oneOneOneRelease],
            }),
            { status: 200 },
          ),
        );
        await maker.make({
          dir: darwinDir,
          makeDir,
          appName,
          targetArch,
          targetPlatform: 'darwin',
          packageJSON,
          forgeConfig: null as any,
        });

        expect(vi.mocked(writeJson)).toHaveBeenCalledWith(expect.anything(), {
          currentRelease: '1.2.3',
          releases: [
            oneOneOneRelease,
            {
              version: '1.2.3',
              updateTo: {
                version: '1.2.3',
                name: 'My Test App v1.2.3',
                url: 'fake://test/foo/fake-darwin-app-1.2.3.zip',
                notes: 'my-notes',
                pub_date: expect.anything(),
                sha256: FAKE_ZIP_SHA256,
                size: FAKE_ZIP_SIZE,
              },
            },
          ],
        });
      });
    });
  });
  // Deltas are only made on macOS hosts, and these tests use real POSIX file
  // modes, which Windows does not have (every writable file reports 0o666).
  describe.skipIf(process.platform === 'win32')('macUpdateDelta', () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(
      process,
      'platform',
    )!;
    const binaryDeltaPath = '/fake/BinaryDelta';
    const baseUrl = 'fake://test/foo';
    const previousZipUrl = `${baseUrl}/fake-darwin-app-1.1.1.zip`;
    const previousZipContents = 'previous zip contents';
    const deltaContents = 'delta contents';
    const previousRelease = {
      version: '1.1.1',
      updateTo: {
        version: '1.1.1',
        name: 'My Test App v1.1.1',
        url: previousZipUrl,
        sha256: sha256(previousZipContents),
        size: Buffer.byteLength(previousZipContents),
      },
    };

    let tmpDir: string;
    let packagedDir: string;
    let newApp: string;
    let deltaMakeDir: string;
    let manifest: object | null;
    let warnSpy: ReturnType<typeof vi.spyOn>;

    const writeApp = (appPath: string) => {
      fs.mkdirSync(path.join(appPath, 'Contents'), { recursive: true });
      fs.writeFileSync(path.join(appPath, 'Contents', 'Info.plist'), 'plist');
      for (const dirPath of [appPath, path.join(appPath, 'Contents')]) {
        fs.chmodSync(dirPath, 0o755);
      }
      fs.chmodSync(path.join(appPath, 'Contents', 'Info.plist'), 0o644);
    };

    const makeMaker = (macUpdateDelta: MakerZIPConfig['macUpdateDelta']) => {
      const maker = new MakerZIP(
        { macUpdateManifestBaseUrl: baseUrl, macUpdateDelta },
        [],
      );
      maker.prepareConfig(targetArch);
      return maker;
    };

    const make = (maker: MakerZIP) =>
      maker.make({
        dir: packagedDir,
        makeDir: deltaMakeDir,
        appName,
        targetArch,
        targetPlatform: 'darwin',
        packageJSON,
        forgeConfig: null as any,
      });

    const writtenRelease = () =>
      vi
        .mocked(writeJson)
        .mock.calls[0][1].releases.find(
          (release: { version: string }) => release.version === '1.2.3',
        );

    const deltaPath = () =>
      path.join(
        deltaMakeDir,
        'zip',
        'darwin',
        targetArch,
        'fake-darwin-app-1.1.1-to-1.2.3.delta',
      );

    beforeEach(() => {
      Object.defineProperty(process, 'platform', {
        ...originalPlatform,
        value: 'darwin',
      });
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-zip-delta-spec-'));
      packagedDir = path.join(tmpDir, 'fake-darwin-app');
      newApp = path.join(packagedDir, `${appName}.app`);
      writeApp(newApp);
      deltaMakeDir = path.join(tmpDir, 'out');

      manifest = { currentRelease: '1.1.1', releases: [previousRelease] };
      mockFetch.mockImplementation(async (url: string) => {
        if (url === `${baseUrl}/RELEASES.json`) {
          return manifest
            ? new Response(JSON.stringify(manifest), { status: 200 })
            : new Response(null, { status: 404 });
        }
        if (url === previousZipUrl) {
          return new Response(previousZipContents, { status: 200 });
        }
        return new Response(null, { status: 404 });
      });

      vi.mocked(spawn).mockImplementation(async (cmd, args = []) => {
        if (cmd === 'ditto') {
          writeApp(path.join(args[3], 'My Old App.app'));
        } else if (cmd === 'plutil') {
          return '412\n';
        } else if (cmd === binaryDeltaPath && args[0] === 'create') {
          fs.writeFileSync(args[args.length - 1], deltaContents);
        }
        return '';
      });
    });

    afterEach(() => {
      Object.defineProperty(process, 'platform', originalPlatform);
      warnSpy.mockRestore();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should add a delta from the previous release to the manifest', async () => {
      const output = await make(makeMaker({ binaryDeltaPath }));

      expect(output).toEqual([
        path.join(
          deltaMakeDir,
          'zip',
          'darwin',
          targetArch,
          'fake-darwin-app-1.2.3.zip',
        ),
        deltaPath(),
        path.join(deltaMakeDir, 'zip', 'darwin', targetArch, 'RELEASES.json'),
      ]);
      expect(fs.readFileSync(deltaPath(), 'utf8')).toEqual(deltaContents);
      expect(mockFetch).toHaveBeenCalledWith(previousZipUrl);
      expect(writtenRelease().updateTo.delta).toEqual({
        from_version: '412',
        url: 'fake://test/foo/fake-darwin-app-1.1.1-to-1.2.3.delta',
        sha256: sha256(deltaContents),
        size: Buffer.byteLength(deltaContents),
      });
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should create, apply and verify the delta with BinaryDelta', async () => {
      await make(makeMaker({ binaryDeltaPath }));

      const calls = vi.mocked(spawn).mock.calls;
      const oldApp = calls.find(([cmd]) => cmd === 'plutil')![1]![5];
      expect(oldApp).toMatch(/My Old App\.app[/\\]Contents[/\\]Info\.plist$/);
      expect(calls).toContainEqual([
        binaryDeltaPath,
        [
          'create',
          '--version',
          '4',
          '--compression',
          'lzma',
          path.dirname(path.dirname(oldApp)),
          newApp,
          deltaPath(),
        ],
      ]);
      const apply = calls.find(
        ([cmd, args]) => cmd === binaryDeltaPath && args![0] === 'apply',
      )!;
      expect(apply[1]![3]).toEqual(deltaPath());
      expect(calls).toContainEqual([
        'codesign',
        ['--verify', '--deep', '--strict', apply[1]![2]],
      ]);
    });

    it('should use CFBundleVersion rather than the manifest version as from_version', async () => {
      vi.mocked(spawn).mockImplementation(async (cmd, args = []) => {
        if (cmd === 'ditto') {
          writeApp(path.join(args[3], 'My Old App.app'));
        } else if (cmd === 'plutil') {
          return '1.1.1.4242\n';
        } else if (cmd === binaryDeltaPath && args[0] === 'create') {
          fs.writeFileSync(args[args.length - 1], deltaContents);
        }
        return '';
      });

      await make(makeMaker({ binaryDeltaPath }));

      expect(writtenRelease().updateTo.delta.from_version).toEqual(
        '1.1.1.4242',
      );
    });

    it('should skip the delta when there is no previous release', async () => {
      manifest = null;
      const output = await make(makeMaker({ binaryDeltaPath }));

      expect(output).toHaveLength(2);
      expect(writtenRelease().updateTo.delta).toBeUndefined();
      expect(spawn).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should skip the delta when the previous release is the same version', async () => {
      manifest = {
        currentRelease: '1.2.3',
        releases: [{ ...previousRelease, version: '1.2.3' }],
      };
      const output = await make(makeMaker({ binaryDeltaPath, strict: true }));

      expect(output).toHaveLength(2);
      expect(writtenRelease().updateTo.delta).toBeUndefined();
      expect(mockFetch).not.toHaveBeenCalledWith(previousZipUrl);
    });

    it('should skip the delta on a non-macOS host', async () => {
      Object.defineProperty(process, 'platform', {
        ...originalPlatform,
        value: 'linux',
      });
      const output = await make(makeMaker({ binaryDeltaPath }));

      expect(output).toHaveLength(2);
      expect(writtenRelease().updateTo.delta).toBeUndefined();
      expect(mockFetch).not.toHaveBeenCalledWith(previousZipUrl);
      expect(spawn).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('requires a macOS host'),
      );
    });

    describe('when BinaryDelta fails', () => {
      beforeEach(() => {
        vi.mocked(spawn).mockImplementation(async (cmd, args = []) => {
          if (cmd === 'ditto') {
            writeApp(path.join(args[3], 'My Old App.app'));
          } else if (cmd === 'plutil') {
            return '412';
          } else if (cmd === binaryDeltaPath) {
            fs.writeFileSync(args[args.length - 1], 'partial');
            throw new Error('BinaryDelta exploded');
          }
          return '';
        });
      });

      it('should warn and publish without a delta', async () => {
        const output = await make(makeMaker({ binaryDeltaPath }));

        expect(output).toHaveLength(2);
        expect(writtenRelease().updateTo.delta).toBeUndefined();
        expect(fs.existsSync(deltaPath())).toBe(false);
        expect(warnSpy).toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining('BinaryDelta exploded'),
        );
      });

      it('should throw in strict mode', async () => {
        await expect(
          make(makeMaker({ binaryDeltaPath, strict: true })),
        ).rejects.toThrow(
          'Failed to create a delta update from 1.1.1 to 1.2.3',
        );
        expect(writeJson).not.toHaveBeenCalled();
      });
    });

    it('should refuse to create a delta for an app with group-writable files', async () => {
      fs.chmodSync(path.join(newApp, 'Contents', 'Info.plist'), 0o664);
      const output = await make(makeMaker({ binaryDeltaPath }));

      expect(output).toHaveLength(2);
      expect(writtenRelease().updateTo.delta).toBeUndefined();
      expect(spawn).not.toHaveBeenCalledWith(
        binaryDeltaPath,
        expect.anything(),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringMatching(
          /group- or other-writable[\s\S]*Contents[/\\]Info\.plist/,
        ),
      );
    });

    it('should verify the previous ZIP against its sha256', async () => {
      manifest = {
        currentRelease: '1.1.1',
        releases: [
          {
            ...previousRelease,
            updateTo: { ...previousRelease.updateTo, sha256: sha256('other') },
          },
        ],
      };
      const output = await make(makeMaker({ binaryDeltaPath }));

      expect(output).toHaveLength(2);
      expect(spawn).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('SHA-256 mismatch'),
      );
    });

    it('should verify the downloaded Sparkle archive', async () => {
      const homeDir = path.join(tmpDir, 'home');
      const homedirSpy = vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
      const fetchPreviousOnly = mockFetch.getMockImplementation()!;
      mockFetch.mockImplementation(async (url: string) =>
        url.startsWith('https://github.com/sparkle-project/Sparkle/')
          ? new Response('not sparkle', { status: 200 })
          : fetchPreviousOnly(url),
      );

      try {
        const output = await make(makeMaker(true));

        expect(output).toHaveLength(2);
        expect(mockFetch).toHaveBeenCalledWith(
          'https://github.com/sparkle-project/Sparkle/releases/download/2.9.5/Sparkle-2.9.5.tar.xz',
        );
        expect(spawn).not.toHaveBeenCalledWith('tar', expect.anything());
        expect(warnSpy).toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining('SHA-256 mismatch'),
        );
      } finally {
        homedirSpy.mockRestore();
      }
    });
  });
});

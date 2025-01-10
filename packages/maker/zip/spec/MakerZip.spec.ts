/* eslint-disable node/no-unsupported-features/es-syntax */
import os from 'node:os';
import path from 'node:path';

import fs from 'fs-extra';
import got from 'got';
import { describe, expect, it, vi } from 'vitest';

import { MakerZIP } from '../src/MakerZIP';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { zip } = require('cross-zip');

vi.hoisted(async () => {
  const { mockRequire } = await import('@electron-forge/test-utils');
  void mockRequire('cross-zip', {
    zip: vi.fn().mockImplementation((_zipDir, _zipPath, callback) => {
      callback();
    }),
  });
});

vi.mock(import('fs-extra'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: {
      ...mod,
      writeJson: vi.fn(),
    },
  };
});

vi.mock(import('got'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: {
      ...mod,
      get: vi.fn(),
    },
  };
});

describe('MakerZip', () => {
  const dir = path.resolve(__dirname, 'fixture', 'fake-app');
  const darwinDir = path.resolve(__dirname, 'fixture', 'fake-darwin-app');
  const makeDir = path.resolve(os.tmpdir(), 'forge-zip-test');
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  it.each([['win32', 'linux']])(`should generate a zip file for a %s app`, async (platform) => {
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
    expect(zip).toHaveBeenCalledWith(dir, path.join(makeDir, 'zip', platform, targetArch, 'fake-app-1.2.3.zip'), expect.anything());
  });

  it.each([['darwin', 'mas']])(`should generate a zip file for a %s app`, async (platform) => {
    const maker = new MakerZIP(
      {
        macUpdateManifestBaseUrl: undefined,
      },
      []
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
      path.join(makeDir, 'zip', platform, targetArch, 'fake-darwin-app-1.2.3.zip'),
      expect.anything()
    );
  });

  describe('macUpdateManifestBaseUrl', () => {
    it.each([['win32', 'mas', 'linux']])('should not make a network request on $platform', async (platform) => {
      const maker = new MakerZIP(
        {
          macUpdateManifestBaseUrl: 'https://electronjs.org',
        },
        []
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
      expect(got.get).not.toHaveBeenCalled();
    });

    describe('when making for the darwin platform', () => {
      it('should fetch the current RELEASES.json and write it to disk', async () => {
        const maker = new MakerZIP(
          {
            macUpdateManifestBaseUrl: 'fake://test/foo',
          },
          []
        );
        maker.prepareConfig(targetArch);
        maker.ensureFile = vi.fn();
        vi.mocked(got.get).mockResolvedValue({ statusCode: 200, body: '{}' });
        await maker.make({
          dir: darwinDir,
          makeDir,
          appName,
          targetArch,
          targetPlatform: 'darwin',
          packageJSON,
          forgeConfig: null as any,
        });

        expect(got.get).toHaveBeenCalledOnce();
        expect(fs.writeJson).toHaveBeenCalledWith(expect.anything(), {
          currentRelease: '1.2.3',
          releases: [
            {
              updateTo: {
                name: 'My Test App v1.2.3',
                notes: '',
                pub_date: expect.anything(),
                url: 'fake://test/foo/fake-darwin-app-1.2.3.zip',
                version: '1.2.3',
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
          []
        );
        maker.prepareConfig(targetArch);
        maker.ensureFile = vi.fn();
        vi.mocked(got.get).mockResolvedValue({ statusCode: 404, body: undefined });
        await maker.make({
          dir: darwinDir,
          makeDir,
          appName,
          targetArch,
          targetPlatform: 'darwin',
          packageJSON,
          forgeConfig: null as any,
        });

        expect(got.get).toHaveBeenCalledOnce();
        expect(fs.writeJson).toHaveBeenCalledWith(expect.anything(), {
          currentRelease: '1.2.3',
          releases: [
            {
              updateTo: {
                name: 'My Test App v1.2.3',
                notes: '',
                pub_date: expect.anything(),
                url: 'fake://test/foo/fake-darwin-app-1.2.3.zip',
                version: '1.2.3',
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
          []
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
        vi.mocked(got.get).mockResolvedValue({
          statusCode: 200,
          body: JSON.stringify({
            currentRelease: '1.1.1',
            releases: [oneOneOneRelease],
          }),
        });
        await maker.make({
          dir: darwinDir,
          makeDir,
          appName,
          targetArch,
          targetPlatform: 'darwin',
          packageJSON,
          forgeConfig: null as any,
        });

        expect(vi.mocked(fs.writeJson)).toHaveBeenCalledWith(expect.anything(), {
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
              },
            },
          ],
        });
      });
    });
  });
});

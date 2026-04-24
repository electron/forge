import path from 'node:path';

import { notarize } from '@electron/notarize';
import { flat } from '@electron/osx-sign';
import { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch, ResolvedForgeConfig } from '@electron-forge/shared-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MakerPKG } from '../src/MakerPKG';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

vi.mock(import('@electron/osx-sign'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    flat: vi.fn(),
  };
});

vi.mock(import('@electron/notarize'), () => ({
  notarize: vi.fn(),
}));

describe('MakerPKG', () => {
  const dir = '/my/test/dir/out';
  const makeDir = '/my/test/dir/make';
  const appName = 'My Test App';
  const targetArch = process.arch as ForgeArch;
  const packageJSON = { version: '1.2.3' };

  const makeForgeConfig = (
    packagerConfig: ResolvedForgeConfig['packagerConfig'] = {},
  ) =>
    ({
      packagerConfig,
    }) as ResolvedForgeConfig;

  beforeEach(() => {
    vi.mocked(flat).mockReset();
    vi.mocked(notarize).mockReset();
  });

  it('should pass through correct defaults', async () => {
    const maker = new MakerPKG({}, []);
    maker.ensureFile = vi.fn();
    await maker.prepareConfig(targetArch);
    await (maker.make as MakeFunction)({
      packageJSON,
      dir,
      makeDir,
      appName,
      targetArch,
      targetPlatform: 'mas',
      forgeConfig: makeForgeConfig(),
    });
    expect(vi.mocked(flat)).toHaveBeenCalledOnce();

    expect(vi.mocked(flat)).toHaveBeenCalledWith({
      app: path.resolve(`${dir}/My Test App.app`),
      pkg: expect.stringContaining(`My Test App-1.2.3-${targetArch}.pkg`),
      platform: 'mas',
    });
    expect(vi.mocked(notarize)).not.toHaveBeenCalled();
  });

  it('should throw an error on invalid platform', async () => {
    const maker = new MakerPKG({}, []);
    maker.ensureFile = vi.fn();
    await maker.prepareConfig(targetArch);
    const promise = (maker.make as MakeFunction)({
      packageJSON,
      dir,
      makeDir,
      appName,
      targetArch,
      targetPlatform: 'win32',
      forgeConfig: makeForgeConfig(),
    });

    await expect(promise).rejects.toThrow(
      'The pkg maker only supports targeting "mas" and "darwin" builds. You provided "win32".',
    );
  });

  it('should notarize the generated pkg when signing identity and osxNotarize are configured', async () => {
    const maker = new MakerPKG({ identity: 'Developer ID Installer: Me' }, []);
    maker.ensureFile = vi.fn();
    await maker.prepareConfig(targetArch);
    const osxNotarize = {
      appleId: 'me@example.com',
      appleIdPassword: 'hunter2',
      teamId: 'TEAM123',
    };
    const outPaths = await (maker.make as MakeFunction)({
      packageJSON,
      dir,
      makeDir,
      appName,
      targetArch,
      targetPlatform: 'darwin',
      forgeConfig: makeForgeConfig({ osxNotarize }),
    });

    expect(vi.mocked(notarize)).toHaveBeenCalledOnce();
    expect(vi.mocked(notarize)).toHaveBeenCalledWith({
      ...osxNotarize,
      appPath: outPaths[0],
    });
  });

  it('should not notarize when signing identity is not configured', async () => {
    const maker = new MakerPKG({}, []);
    maker.ensureFile = vi.fn();
    await maker.prepareConfig(targetArch);
    await (maker.make as MakeFunction)({
      packageJSON,
      dir,
      makeDir,
      appName,
      targetArch,
      targetPlatform: 'darwin',
      forgeConfig: makeForgeConfig({
        osxNotarize: {
          appleId: 'me@example.com',
          appleIdPassword: 'hunter2',
          teamId: 'TEAM123',
        },
      }),
    });

    expect(vi.mocked(notarize)).not.toHaveBeenCalled();
  });

  it('should not notarize when osxNotarize is not configured', async () => {
    const maker = new MakerPKG({ identity: 'Developer ID Installer: Me' }, []);
    maker.ensureFile = vi.fn();
    await maker.prepareConfig(targetArch);
    await (maker.make as MakeFunction)({
      packageJSON,
      dir,
      makeDir,
      appName,
      targetArch,
      targetPlatform: 'darwin',
      forgeConfig: makeForgeConfig(),
    });

    expect(vi.mocked(notarize)).not.toHaveBeenCalled();
  });
});

import path from 'node:path';

import { flat } from '@electron/osx-sign';
import { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch } from '@electron-forge/shared-types';
import { describe, expect, it, vi } from 'vitest';

import { MakerPKG } from '../src/MakerPKG';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

vi.mock(import('@electron/osx-sign'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    flat: vi.fn(),
  };
});

describe('MakerPKG', () => {
  const dir = '/my/test/dir/out';
  const makeDir = '/my/test/dir/make';
  const appName = 'My Test App';
  const targetArch = process.arch as ForgeArch;
  const packageJSON = { version: '1.2.3' };

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
    });
    expect(vi.mocked(flat)).toHaveBeenCalledOnce();

    expect(vi.mocked(flat)).toHaveBeenCalledWith({
      app: path.resolve(`${dir}/My Test App.app`),
      pkg: expect.stringContaining(`My Test App-1.2.3-${targetArch}.pkg`),
      platform: 'mas',
    });
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
    });

    await expect(promise).rejects.toThrow(
      'The pkg maker only supports targeting "mas" and "darwin" builds. You provided "win32".',
    );
  });
});

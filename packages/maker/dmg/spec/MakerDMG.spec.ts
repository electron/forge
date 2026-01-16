import { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch } from '@electron-forge/shared-types';
import { createDMG } from 'electron-installer-dmg';
import fs from 'fs-extra';
import { describe, expect, it, vi } from 'vitest';

import { MakerDMG } from '../src/MakerDMG';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

vi.mock(import('electron-installer-dmg'), () => {
  return {
    createDMG: vi.fn(),
  };
});

vi.mock(import('fs-extra'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: {
      ...mod.default,
      rename: vi.fn(),
    },
  };
});

describe('MakerDMG', () => {
  const dir = '/my/test/dir/out';
  const makeDir = '/my/test/dir/make';
  const appName = 'My Test App';
  const targetArch = process.arch as ForgeArch;
  const packageJSON = { version: '1.2.3' };

  it('should pass through correct defaults', async () => {
    const maker = new MakerDMG({}, []);
    maker.ensureFile = vi.fn();
    await maker.prepareConfig(targetArch);
    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    expect(vi.mocked(createDMG)).toHaveBeenCalledOnce();
  });

  it('should attempt to rename the DMG file with version if no custom name is set', async () => {
    const maker = new MakerDMG({}, []);
    maker.ensureFile = vi.fn();
    await maker.prepareConfig(targetArch);
    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    expect(vi.mocked(fs.rename)).toHaveBeenCalledOnce();
    expect(vi.mocked(fs.rename)).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining(`1.2.3-${targetArch}`),
    );
  });

  it('should not attempt to rename the DMG file if a custom name is set', async () => {
    const maker = new MakerDMG({ name: 'custom-app-name' }, []);
    maker.ensureFile = vi.fn();
    await maker.prepareConfig(targetArch);
    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    expect(vi.mocked(fs.rename)).not.toHaveBeenCalled();
  });
});

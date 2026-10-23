import fs from 'node:fs/promises';
import path from 'node:path';

import { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch, ResolvedForgeConfig } from '@electron-forge/shared-types';
import { createDMG } from 'electron-installer-dmg';
import { describe, expect, it, vi } from 'vitest';

import { MakerDMG } from '../src/MakerDMG';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

vi.mock(import('electron-installer-dmg'), () => {
  return {
    createDMG: vi.fn(),
  };
});

vi.mock(import('node:fs/promises'), async (importOriginal) => {
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
  const makeForgeConfig = (
    packagerConfig: ResolvedForgeConfig['packagerConfig'] = {},
  ) => ({ packagerConfig }) as ResolvedForgeConfig;

  it.each([
    ['darwin', 'x64'],
    ['darwin', 'arm64'],
    ['mas', 'x64'],
    ['mas', 'arm64'],
  ] as const)(
    'should use appVersion in the default DMG artifact path for %s/%s',
    async (targetPlatform, targetArch) => {
      const maker = new MakerDMG({}, []);
      maker.ensureFile = vi.fn();
      await maker.prepareConfig(targetArch);
      const artifacts = await (maker.make as MakeFunction)({
        dir,
        makeDir,
        appName,
        targetArch,
        targetPlatform,
        packageJSON,
        forgeConfig: makeForgeConfig({ appVersion: '2.0.0-beta.1' }),
      });
      const expectedPath = path.resolve(
        makeDir,
        'dmg',
        targetArch,
        `${appName}-2.0.0-beta.1-${targetArch}.dmg`,
      );
      expect(artifacts).toEqual([expectedPath]);
      expect(vi.mocked(fs.rename)).toHaveBeenCalledExactlyOnceWith(
        path.resolve(makeDir, 'dmg', targetArch, `${appName}.dmg`),
        expectedPath,
      );
      expect(maker.ensureFile).toHaveBeenLastCalledWith(expectedPath);
      expect(vi.mocked(createDMG)).toHaveBeenCalledExactlyOnceWith({
        overwrite: true,
        name: appName,
        appPath: path.resolve(dir, `${appName}.app`),
        out: path.resolve(makeDir, 'dmg', targetArch),
      });
    },
  );

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
      forgeConfig: makeForgeConfig(),
    });
    expect(vi.mocked(createDMG)).toHaveBeenCalledOnce();
  });

  it('should output to an arch-specific subdirectory to avoid conflicts between parallel makers', async () => {
    const maker = new MakerDMG({}, []);
    maker.ensureFile = vi.fn();
    await maker.prepareConfig(targetArch);
    const expectedDir = path.resolve(makeDir, 'dmg', targetArch);
    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
      forgeConfig: makeForgeConfig(),
    });
    expect(vi.mocked(createDMG)).toHaveBeenCalledWith(
      expect.objectContaining({ out: expectedDir }),
    );
    expect(vi.mocked(fs.rename)).toHaveBeenCalledWith(
      expect.stringContaining(expectedDir),
      expect.stringContaining(expectedDir),
    );
  });

  it.each([undefined, ''])(
    'should use package.json version when appVersion is %j',
    async (appVersion) => {
      const maker = new MakerDMG({}, []);
      maker.ensureFile = vi.fn();
      await maker.prepareConfig(targetArch);
      const artifacts = await (maker.make as MakeFunction)({
        dir,
        makeDir,
        appName,
        targetArch,
        packageJSON,
        forgeConfig: makeForgeConfig({ appVersion }),
      });
      const expectedPath = path.resolve(
        makeDir,
        'dmg',
        targetArch,
        `${appName}-${packageJSON.version}-${targetArch}.dmg`,
      );
      expect(artifacts).toEqual([expectedPath]);
      expect(vi.mocked(fs.rename)).toHaveBeenCalledExactlyOnceWith(
        path.resolve(makeDir, 'dmg', targetArch, `${appName}.dmg`),
        expectedPath,
      );
    },
  );

  it.each([undefined, '2.0.0-beta.1'])(
    'should preserve a custom DMG name when appVersion is %j',
    async (appVersion) => {
      const maker = new MakerDMG({ name: 'custom-app-name' }, []);
      maker.ensureFile = vi.fn();
      await maker.prepareConfig(targetArch);
      const artifacts = await (maker.make as MakeFunction)({
        dir,
        makeDir,
        appName,
        targetArch,
        packageJSON,
        forgeConfig: makeForgeConfig({ appVersion }),
      });
      const expectedPath = path.resolve(
        makeDir,
        'dmg',
        targetArch,
        'custom-app-name.dmg',
      );
      expect(artifacts).toEqual([expectedPath]);
      expect(vi.mocked(fs.rename)).not.toHaveBeenCalled();
      expect(maker.ensureFile).toHaveBeenCalledExactlyOnceWith(expectedPath);
      expect(vi.mocked(createDMG)).toHaveBeenCalledExactlyOnceWith({
        overwrite: true,
        name: 'custom-app-name',
        appPath: path.resolve(dir, `${appName}.app`),
        out: path.resolve(makeDir, 'dmg', targetArch),
      });
    },
  );
});

import * as path from 'node:path';

import { PluginBase } from '@electron-forge/plugin-base';
import {
  ForgeMultiHookMap,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import { packager } from '@electron/packager';
import { afterEach, describe, expect, it, vi } from 'vitest';

import make from '../../src/api/make';
import {
  registerForgeConfigForDirectory,
  unregisterForgeConfigForDirectory,
} from '../../src/util/forge-config';
import { loadMakeResults } from '../../src/util/make-results';

vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    getElectronVersion: vi.fn().mockResolvedValue('1.0.0'),
  };
});

vi.mock(import('@electron/packager'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    packager: vi.fn(),
  };
});

describe('make', () => {
  const fixtureDir = path.resolve(import.meta.dirname, '../fixture');

  describe('plugin lifecycle', () => {
    const appDir = path.join(fixtureDir, 'dummy_app');

    class LifecyclePlugin extends PluginBase<Record<string, never>> {
      name = 'lifecycle';

      init = vi.fn((dir: string, config: ResolvedForgeConfig) =>
        super.init(dir, config),
      );

      resolveForgeConfig = vi.fn(async (config: ResolvedForgeConfig) => config);

      prePackage = vi.fn(async (_config: ResolvedForgeConfig) => undefined);

      getHooks(): ForgeMultiHookMap {
        return {
          resolveForgeConfig: this.resolveForgeConfig,
          prePackage: this.prePackage,
        };
      }
    }

    afterEach(() => {
      unregisterForgeConfigForDirectory(appDir);
    });

    // Regression test for https://github.com/electron/forge/issues/3452.
    // `make` runs `package` as a nested step; the config it resolved must be
    // reused there rather than resolved a second time, otherwise every plugin
    // is initialized twice and `resolveForgeConfig` mutations are applied twice.
    it('initializes plugins once when running the nested package step', async () => {
      const plugin = new LifecyclePlugin({});
      registerForgeConfigForDirectory(appDir, {
        plugins: [plugin],
        makers: [{ name: '../custom-maker', config: {} }],
      });
      // Both duplicate lifecycle calls happen before packaging starts, so the
      // packager itself can abort the run once it is reached.
      vi.mocked(packager).mockRejectedValue(new Error('stop at packager'));

      await expect(
        make({
          arch: 'x64',
          dir: appDir,
          platform: 'linux',
          outDir: path.join(appDir, 'out'),
        }),
      ).rejects.toThrow('stop at packager');

      expect(packager).toHaveBeenCalledOnce();
      expect(plugin.init).toHaveBeenCalledOnce();
      expect(plugin.resolveForgeConfig).toHaveBeenCalledOnce();
      expect(plugin.prePackage).toHaveBeenCalledOnce();
      // The package step's hooks run against the config that make resolved.
      expect(plugin.prePackage.mock.calls[0][0]).toBe(
        plugin.resolveForgeConfig.mock.calls[0][0],
      );
    });
  });

  it('works with @scoped package names', { timeout: 10_000 }, async () => {
    const result = await make({
      arch: 'x64',
      dir: path.join(fixtureDir, 'app-with-scoped-name'),
      platform: 'linux',
      fromPackage: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].artifacts).toEqual([
      expect.stringContaining('@scope-package-linux-x64-1.0.0.zip'),
    ]);
  });

  it('accepts the deprecated skipPackage alias', async () => {
    const result = await make({
      arch: 'x64',
      dir: path.join(fixtureDir, 'app-with-scoped-name'),
      platform: 'linux',
      skipPackage: true,
    });
    expect(packager).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('saves its results so they can be released later', async () => {
    const dir = path.join(fixtureDir, 'app-with-scoped-name');
    const results = await make({
      arch: 'x64',
      dir,
      platform: 'linux',
      fromPackage: true,
    });

    expect(results[0].maker).toEqual('zip');
    await expect(loadMakeResults(path.join(dir, 'out'), dir)).resolves.toEqual([
      results,
    ]);
  });

  it('can override targets', async () => {
    const results = await make({
      arch: 'x64',
      dir: path.join(fixtureDir, 'app-with-custom-maker-config'),
      overrideTargets: ['../custom-maker'],
      platform: 'linux',
      fromPackage: true,
    });

    expect(results[0].artifacts).toEqual(['from config']);
  });

  it('throws an error if the name is not a string', async () => {
    await expect(
      make({
        arch: 'x64',
        dir: path.join(fixtureDir, 'maker-name-wrong-type'),
        platform: 'linux',
        fromPackage: true,
      }),
    ).rejects.toThrowError(
      /^The following maker config has a maker name that is not a string:/,
    );
  });

  it('throws an error if the name is missing', async () => {
    await expect(
      make({
        arch: 'x64',
        dir: path.join(fixtureDir, 'maker-sans-name'),
        platform: 'linux',
        fromPackage: true,
      }),
    ).rejects.toThrowError(
      /^The following maker config is missing a maker name:/,
    );
  });

  it('can skip makers via config', async () => {
    await expect(
      make({
        arch: 'x64',
        dir: path.join(fixtureDir, 'app-with-maker-disable'),
        platform: 'linux',
        fromPackage: true,
      }),
    ).rejects.toThrowError(
      /Could not find any make targets configured for the "linux" platform./,
    );
  });

  it('throws if maker cannot be resolved', async () => {
    const opts = {
      arch: 'x64',
      dir: path.join(fixtureDir, 'app-with-custom-maker-config'),
      platform: 'linux',
      fromPackage: true,
    };

    await expect(make(opts)).rejects.toThrowError(
      "Could not find module with name '@electron-forge/non-existent-forge-maker'",
    );
  });
});

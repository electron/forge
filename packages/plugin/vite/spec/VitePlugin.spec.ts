import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { IgnoreFunction } from '@electron/packager';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { VitePluginConfig } from '../src/Config';
import { VitePlugin } from '../src/VitePlugin';

describe('VitePlugin', async () => {
  const baseConfig: VitePluginConfig = {
    build: [],
    renderer: [],
  };

  const tmp = os.tmpdir();
  const tmpdir = path.join(tmp, 'electron-forge-test-');
  const viteTestDir = await fs.promises.mkdtemp(tmpdir);

  describe('packageAfterCopy', () => {
    const packageJSONPath = path.join(viteTestDir, 'package.json');
    const packagedPath = path.join(viteTestDir, 'packaged');
    const packagedPackageJSONPath = path.join(packagedPath, 'package.json');
    let plugin: VitePlugin;

    beforeAll(async () => {
      await fs.promises.mkdir(packagedPath);
      plugin = new VitePlugin(baseConfig);
      plugin.setDirectories(viteTestDir);
    });

    it('should remove config.forge from package.json', async () => {
      const packageJSON = { main: './.vite/build/main.js', config: { forge: 'config.js' } };
      await fs.promises.writeFile(packageJSONPath, JSON.stringify(packageJSON), 'utf-8');
      await plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath);
      expect(fs.existsSync(packagedPackageJSONPath)).toEqual(true);
      expect(JSON.parse(await fs.promises.readFile(packagedPackageJSONPath, 'utf-8')).config).not.toHaveProperty('forge');
    });

    it('should succeed if there is no config.forge', async () => {
      const packageJSON = { main: '.vite/build/main.js' };
      await fs.promises.writeFile(packageJSONPath, JSON.stringify(packageJSON), 'utf-8');
      await plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath);
      expect(fs.existsSync(packagedPackageJSONPath)).toEqual(true);
      expect(JSON.parse(await fs.promises.readFile(packagedPackageJSONPath, 'utf-8'))).not.toHaveProperty('config');
    });

    it('should fail if there is no main key in package.json', async () => {
      const packageJSON = {};
      await fs.promises.writeFile(packageJSONPath, JSON.stringify(packageJSON), 'utf-8');
      await expect(plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath)).rejects.toThrow(/entry point/);
    });

    it('should fail if main in package.json does not starts with .vite/', async () => {
      const packageJSON = { main: 'src/main.js' };
      await fs.promises.writeFile(packageJSONPath, JSON.stringify(packageJSON), 'utf-8');
      await expect(plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath)).rejects.toThrow(/entry point/);
    });

    afterAll(async () => {
      await fs.promises.rm(viteTestDir, { recursive: true });
    });
  });

  describe('resolveForgeConfig', () => {
    let plugin: VitePlugin;

    beforeAll(() => {
      plugin = new VitePlugin(baseConfig);
    });

    it('sets packagerConfig and packagerConfig.ignore if it does not exist', async () => {
      const config = await plugin.resolveForgeConfig({} as ResolvedForgeConfig);
      expect(config.packagerConfig).not.toEqual(undefined);
      expect(config.packagerConfig.ignore).toBeTypeOf('function');
    });

    describe('packagerConfig.ignore', () => {
      it('does not overwrite an existing ignore value', async () => {
        const config = await plugin.resolveForgeConfig({
          packagerConfig: {
            ignore: /test/,
          },
        } as ResolvedForgeConfig);

        expect(config.packagerConfig.ignore).toEqual(/test/);
      });

      it('ignores everything but files in .vite', async () => {
        const config = await plugin.resolveForgeConfig({} as ResolvedForgeConfig);
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore('')).toEqual(false);
        expect(ignore('/abc')).toEqual(true);
        expect(ignore('/.vite')).toEqual(false);
        expect(ignore('/.vite/foo')).toEqual(false);
      });

      it('ignores source map files by default', async () => {
        const viteConfig = { ...baseConfig };
        plugin = new VitePlugin(viteConfig);
        const config = await plugin.resolveForgeConfig({} as ResolvedForgeConfig);
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore(path.posix.join('/.vite', 'build', 'main.js'))).toEqual(false);
        expect(ignore(path.posix.join('/.vite', 'build', 'main.js.map'))).toEqual(false);
        expect(ignore(path.posix.join('/.vite', 'renderer', 'main_window', 'assets', 'index.js'))).toEqual(false);
        expect(ignore(path.posix.join('/.vite', 'renderer', 'main_window', 'assets', 'index.js.map'))).toEqual(false);
      });

      it('includes source map files when specified by config', async () => {
        const viteConfig = { ...baseConfig, packageSourceMaps: true };
        plugin = new VitePlugin(viteConfig);
        const config = await plugin.resolveForgeConfig({} as ResolvedForgeConfig);
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore(path.posix.join('/.vite', 'build', 'main.js'))).toEqual(false);
        expect(ignore(path.posix.join('/.vite', 'build', 'main.js.map'))).toEqual(false);
        expect(ignore(path.posix.join('/.vite', 'renderer', 'main_window', 'assets', 'index.js'))).toEqual(false);
        expect(ignore(path.posix.join('/.vite', 'renderer', 'main_window', 'assets', 'index.js.map'))).toEqual(false);
      });
    });
  });
});

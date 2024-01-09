import * as os from 'os';
import * as path from 'path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { IgnoreFunction } from '@electron/packager';
import { expect } from 'chai';
import * as fs from 'fs-extra';

import { VitePluginConfig } from '../src/Config';
import { VitePlugin } from '../src/VitePlugin';

describe('VitePlugin', () => {
  const baseConfig: VitePluginConfig = {
    build: [],
    renderer: [],
  };

  const viteTestDir = path.resolve(os.tmpdir(), 'electron-forge-plugin-vite-test');

  describe('packageAfterCopy', () => {
    const packageJSONPath = path.join(viteTestDir, 'package.json');
    const packagedPath = path.join(viteTestDir, 'packaged');
    const packagedPackageJSONPath = path.join(packagedPath, 'package.json');
    let plugin: VitePlugin;

    before(async () => {
      await fs.ensureDir(packagedPath);
      plugin = new VitePlugin(baseConfig);
      plugin.setDirectories(viteTestDir);
    });

    it('should remove config.forge from package.json', async () => {
      const packageJSON = { main: './.vite/build/main.js', config: { forge: 'config.js' } };
      await fs.writeJson(packageJSONPath, packageJSON);
      await plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath);
      expect(await fs.pathExists(packagedPackageJSONPath)).to.equal(true);
      expect((await fs.readJson(packagedPackageJSONPath)).config).to.not.have.property('forge');
    });

    it('should succeed if there is no config.forge', async () => {
      const packageJSON = { main: '.vite/build/main.js' };
      await fs.writeJson(packageJSONPath, packageJSON);
      await plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath);
      expect(await fs.pathExists(packagedPackageJSONPath)).to.equal(true);
      expect(await fs.readJson(packagedPackageJSONPath)).to.not.have.property('config');
    });

    it('should fail if there is no main key in package.json', async () => {
      const packageJSON = {};
      await fs.writeJson(packageJSONPath, packageJSON);
      await expect(plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath)).to.eventually.be.rejectedWith(/entry point/);
    });

    it('should fail if main in package.json does not starts with .vite/', async () => {
      const packageJSON = { main: 'src/main.js' };
      await fs.writeJson(packageJSONPath, packageJSON);
      await expect(plugin.packageAfterCopy({} as ResolvedForgeConfig, packagedPath)).to.eventually.be.rejectedWith(/entry point/);
    });

    after(async () => {
      await fs.remove(viteTestDir);
    });
  });

  describe('resolveForgeConfig', () => {
    let plugin: VitePlugin;

    before(() => {
      plugin = new VitePlugin(baseConfig);
    });

    it('sets packagerConfig and packagerConfig.ignore if it does not exist', async () => {
      const config = await plugin.resolveForgeConfig({} as ResolvedForgeConfig);
      expect(config.packagerConfig).to.not.equal(undefined);
      expect(config.packagerConfig.ignore).to.be.a('function');
    });

    describe('packagerConfig.ignore', () => {
      it('does not overwrite an existing ignore value', async () => {
        const config = await plugin.resolveForgeConfig({
          packagerConfig: {
            ignore: /test/,
          },
        } as ResolvedForgeConfig);

        expect(config.packagerConfig.ignore).to.deep.equal(/test/);
      });

      it('ignores everything but files in .vite', async () => {
        const config = await plugin.resolveForgeConfig({} as ResolvedForgeConfig);
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore('')).to.equal(false);
        expect(ignore('/abc')).to.equal(true);
        expect(ignore('/.vite')).to.equal(false);
        expect(ignore('/.vite/foo')).to.equal(false);
      });

      it('ignores source map files by default', async () => {
        const viteConfig = { ...baseConfig };
        plugin = new VitePlugin(viteConfig);
        const config = await plugin.resolveForgeConfig({} as ResolvedForgeConfig);
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore(path.posix.join('/.vite', 'build', 'main.js'))).to.equal(false);
        expect(ignore(path.posix.join('/.vite', 'build', 'main.js.map'))).to.equal(false);
        expect(ignore(path.posix.join('/.vite', 'renderer', 'main_window', 'assets', 'index.js'))).to.equal(false);
        expect(ignore(path.posix.join('/.vite', 'renderer', 'main_window', 'assets', 'index.js.map'))).to.equal(false);
      });

      it('includes source map files when specified by config', async () => {
        const viteConfig = { ...baseConfig, packageSourceMaps: true };
        plugin = new VitePlugin(viteConfig);
        const config = await plugin.resolveForgeConfig({} as ResolvedForgeConfig);
        const ignore = config.packagerConfig.ignore as IgnoreFunction;

        expect(ignore(path.posix.join('/.vite', 'build', 'main.js'))).to.equal(false);
        expect(ignore(path.posix.join('/.vite', 'build', 'main.js.map'))).to.equal(false);
        expect(ignore(path.posix.join('/.vite', 'renderer', 'main_window', 'assets', 'index.js'))).to.equal(false);
        expect(ignore(path.posix.join('/.vite', 'renderer', 'main_window', 'assets', 'index.js.map'))).to.equal(false);
      });
    });
  });
});

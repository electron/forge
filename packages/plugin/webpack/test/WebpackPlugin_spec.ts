import { expect } from 'chai';
import * as fs from 'fs-extra';
import * as path from 'path';
import { tmpdir } from 'os';

import WebpackPlugin from '../src/WebpackPlugin';

describe('WebpackPlugin', () => {
  const baseConfig = {
    mainConfig: {},
    renderer: {
      config: {},
      entryPoints: [],
    },
  };

  const webpackTestDir = path.resolve(tmpdir(), 'electron-forge-plugin-webpack-test');

  describe('TCP port', () => {
    it('should fail for privileged ports', () => {
      expect(() => new WebpackPlugin({ ...baseConfig, loggerPort: 80 })).to.throw(/privileged$/);
    });

    it('should fail for too-large port numbers', () => {
      expect(() => new WebpackPlugin({ ...baseConfig, loggerPort: 99999 })).to.throw(/not a valid TCP port/);
    });
  });

  describe('packageAfterCopy', () => {
    const packageJSONPath = path.join(webpackTestDir, 'package.json');
    const packagedPath = path.join(webpackTestDir, 'packaged');
    const packagedPackageJSONPath = path.join(packagedPath, 'package.json');
    let plugin: WebpackPlugin;

    before(async () => {
      await fs.ensureDir(packagedPath);
      plugin = new WebpackPlugin(baseConfig);
      plugin.setDirectories(webpackTestDir);
    });

    it('should remove config.forge from package.json', async () => {
      const packageJSON = { config: { forge: 'config.js' } };
      await fs.writeJson(packageJSONPath, packageJSON);
      await plugin.packageAfterCopy(null, packagedPath);
      expect(await fs.pathExists(packagedPackageJSONPath)).to.equal(true);
      expect((await fs.readJson(packagedPackageJSONPath)).config).to.not.have.property('forge');
    });

    it('should succeed if there is no config.forge', async () => {
      const packageJSON = { name: 'test' };
      await fs.writeJson(packageJSONPath, packageJSON);
      await plugin.packageAfterCopy(null, packagedPath);
      expect(await fs.pathExists(packagedPackageJSONPath)).to.equal(true);
      expect((await fs.readJson(packagedPackageJSONPath))).to.not.have.property('config');
    });

    after(async () => {
      await fs.remove(webpackTestDir);
    });
  });
});

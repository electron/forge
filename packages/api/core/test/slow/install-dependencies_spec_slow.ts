import os from 'os';
import path from 'path';

import { expect } from 'chai';
import fs from 'fs-extra';

import installDeps from '../../src/util/install-dependencies';

if (!(process.platform === 'linux' && process.env.CI)) {
  describe('install-dependencies', () => {
    const installDir = path.resolve(os.tmpdir(), 'electron-forge-test-install-dependencies');

    before(async () => {
      fs.ensureDir(installDir);
    });

    it('should install the latest minor version when the dependency has a caret', async () => {
      await installDeps(installDir, ['debug@^2.0.0']);

      const packageJSON = require(path.resolve(installDir, 'node_modules', 'debug', 'package.json'));
      expect(packageJSON.version).to.not.equal('2.0.0');
    });

    after(async () => fs.remove(installDir));
  });
}

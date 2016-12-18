import fs from 'fs-promise';
import path from 'path';
import os from 'os';
import ora from 'ora';
import { spawn as yarnOrNPMSpawn, hasYarn } from 'yarn-or-npm';

import { expect } from 'chai';

import rebuild from '../src/util/rebuild';

ora.ora = ora;

describe('rebuilder', () => {
  const testModulePath = path.resolve(os.tmpdir(), 'electron-forge-rebuild-test');

  async function expectForgeMeta(npmPackage, shouldExist = true) {
    const forgeMeta = path.resolve(testModulePath, 'node_modules', npmPackage, 'build', 'Release', '.forge-meta');
    expect(await fs.exists(forgeMeta), `${npmPackage} build meta ${shouldExist ? 'should' : 'should not'} exist`).to.equal(shouldExist);
  }

  before(async () => {
    await fs.remove(testModulePath);
    await fs.mkdirs(testModulePath);
    await fs.writeFile(path.resolve(testModulePath, 'package.json'), await fs.readFile(path.resolve(__dirname, 'fixture/native_app/package.json'), 'utf8'));
    await new Promise((resolve, reject) => {
      const child = yarnOrNPMSpawn(hasYarn() ? [] : ['install'], {
        cwd: testModulePath,
        stdio: process.platform === 'win32' ? 'inherit' : 'pipe',
      });
      child.on('exit', (code) => {
        if (code === 0) resolve();
        if (code !== 0) reject(new Error('Failed to install dependencies for test module'));
      });
    });
  });

  before(async () => {
    await rebuild(testModulePath, '1.4.12', process.platform, process.arch);
  });

  it('should have rebuilt top level prod dependencies', async () => {
    expectForgeMeta('ref');
  });

  it('should have rebuilt children of top level prod dependencies', async () => {
    expectForgeMeta('microtime');
  });

  it('should have rebuilt children of scoped top level prod dependencies', async () => {
    expectForgeMeta('@paulcbetts/cld');
  });

  it('should have rebuilt top level optional dependencies', async () => {
    expectForgeMeta('zipfile');
  });

  it('should not have rebuilt top level devDependencies', async () => {
    expectForgeMeta('ffi', false);
  });

  after(async () => {
    await fs.remove(testModulePath);
  });
});

import fs from 'fs-promise';
import mkdirp from 'mkdirp';
import path from 'path';
import pify from 'pify';
import os from 'os';
import ora from 'ora';
import rimraf from 'rimraf';
import { spawn as yarnOrNPMSpawn, hasYarn } from 'yarn-or-npm';

import { expect } from 'chai';

import rebuild from '../src/util/rebuild';

ora.ora = ora;

describe('rebuilder', () => {
  const testModulePath = path.resolve(os.tmpdir(), 'electron-forge-rebuild-test');

  before(async () => {
    await pify(rimraf)(testModulePath);
    console.log(testModulePath);
    await pify(mkdirp)(testModulePath);
    await fs.writeFile(path.resolve(testModulePath, 'package.json'), await fs.readFile(path.resolve(__dirname, 'fixture/native_app/package.json'), 'utf8'));
    await new Promise((resolve, reject) => {
      const child = yarnOrNPMSpawn(hasYarn() ? [] : ['install'], {
        cwd: testModulePath,
        stdio: 'inherit',
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
    const forgeMeta = path.resolve(testModulePath, 'node_modules', 'ref', 'build', 'Release', '.forge-meta');
    expect(await fs.exists(forgeMeta), 'ref build meta should exist').to.equal(true);
  });

  it('should have rebuilt children of top level prod dependencies', async () => {
    const forgeMeta = path.resolve(testModulePath, 'node_modules', 'mdns', 'build', 'Release', '.forge-meta');
    expect(await fs.exists(forgeMeta), 'mdns build meta should exist').to.equal(true);
  });

  it('should have rebuilt children of scoped top level prod dependencies', async () => {
    const forgeMeta = path.resolve(testModulePath, 'node_modules', 'bcrypt', 'build', 'Release', '.forge-meta');
    expect(await fs.exists(forgeMeta), 'bcrypt build meta should exist').to.equal(true);
  });

  it('should have rebuilt top level optional dependencies', async () => {
    const forgeMeta = path.resolve(testModulePath, 'node_modules', 'utp-native', 'build', 'Release', '.forge-meta');
    expect(await fs.exists(forgeMeta), 'utp-native build meta should exist').to.equal(true);
  });

  it('should not have rebuilt top level devDependencies', async () => {
    const forgeMeta = path.resolve(testModulePath, 'node_modules', 'ffi', 'build', 'Release', '.forge-meta');
    expect(await fs.exists(forgeMeta), 'ffi build meta should not exist').to.equal(false);
  });

  after(async () => {
    await pify(rimraf)(testModulePath);
  });
});

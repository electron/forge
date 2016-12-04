import { spawn } from 'child_process';
import fs from 'fs-promise';
import os from 'os';
import path from 'path';
import rimraf from 'rimraf';

import { expect } from 'chai';

const pSpawn = async (args = [], opts = {}) => {
  const child = spawn(process.execPath, [path.resolve(__dirname, '../dist/electron-forge.js')].concat(args), opts);
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (data) => { stdout += data; });
  child.stderr.on('data', (data) => { stderr += data; });
  return new Promise((resolve, reject) => {
    child.on('exit', (code) => {
      if (code === 0) {
        return resolve(stdout);
      }
      reject(new Error(stderr));
    });
  });
};

const installer = process.argv.find(arg => arg.startsWith('--installer=')) || '--installer=system default';

describe(`electron-forge CLI (with installer=${installer.substr(12)})`, () => {
  it('should output help', async () => {
    expect(await pSpawn(['--help'])).to.contain('Usage: electron-forge [options] [command]');
  });

  const forLintingMethod = (lintStyle) => {
    describe(`init (with lintStyle=${lintStyle})`, () => {
      let dir;

      before(async () => {
        dir = path.resolve(os.tmpdir(), `electron-forge-test-${Date.now()}`);
        await pSpawn(['init', dir, `--lintstyle=${lintStyle}`]);
      });

      it('should create a new folder with a npm module inside', async () => {
        expect(await fs.exists(dir), 'the target dir should have been created').to.equal(true);
        expect(await fs.exists(path.resolve(dir, 'package.json')), 'the package.json file should exist').to.equal(true);
      });

      it('should have initialized a git repository', async () => {
        expect(await fs.exists(path.resolve(dir, '.git')), 'the .git folder should exist').to.equal(true);
      });

      it('should have installed the initial node_modules', async () => {
        expect(await fs.exists(path.resolve(dir, 'node_modules')), 'node_modules folder should exist').to.equal(true);
        expect(await fs.exists(path.resolve(dir, 'node_modules/electron-prebuilt-compile')), 'electron-prebuilt-compile should exist').to.equal(true);
        expect(await fs.exists(path.resolve(dir, 'node_modules/babel-core')), 'babel-core should exist').to.equal(true);
      });

      describe('lint', () => {
        it('should initially pass the linting process', () => pSpawn(['lint', dir]));
      });

      after(done => rimraf(dir, done));
    });
  };
  forLintingMethod('airbnb');
  forLintingMethod('standard');

  describe('after init', () => {
    let dir;

    before(async () => {
      dir = path.resolve(os.tmpdir(), `electron-forge-test-${`${Date.now()}`.substr(7)}`);
      await pSpawn(['init', dir]);
      await pSpawn(['package', dir]);
    });

    let targets = [];
    if (fs.existsSync(path.resolve(__dirname, `../src/makers/${process.platform}`))) {
      targets = fs.readdirSync(path.resolve(__dirname, `../src/makers/${process.platform}`)).map(file => path.parse(file).name);
    }
    const genericTargets = fs.readdirSync(path.resolve(__dirname, '../src/makers/generic')).map(file => path.parse(file).name);

    [].concat(targets).concat(genericTargets).forEach((target) => {
      describe(`make (with target=${target})`, () => {
        before(async () => {
          const packageJSON = JSON.parse(await fs.readFile(path.resolve(dir, 'package.json'), 'utf8'));
          packageJSON.config.forge.make_targets[process.platform] = [target];
          await fs.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON));
        });

        it('successfully makes with default config', async () => {
          await pSpawn(['make', dir, '-s']);
        });
      });
    });

    after(done => rimraf(dir, done));
  });
});

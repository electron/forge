import { execSync } from 'child_process';
import fs from 'fs-promise';
import os from 'os';
import path from 'path';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

import installDeps from '../../src/util/install-dependencies';
import readPackageJSON from '../../src/util/read-package-json';

const installer = process.argv.find(arg => arg.startsWith('--installer=')) || '--installer=system default';
const forge = proxyquire.noCallThru().load('../../src/api', {
  './install': async () => {},
});

describe(`electron-forge API (with installer=${installer.substr(12)})`, () => {
  let dirID = Date.now();
  const forLintingMethod = (lintStyle) => {
    describe(`init (with lintStyle=${lintStyle})`, () => {
      let dir;

      before(async () => {
        dir = path.resolve(os.tmpdir(), `electron-forge-test-${dirID}`);
        dirID += 1;
        await fs.remove(dir);
        await forge.init({
          dir,
          lintstyle: lintStyle,
        });
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

      it('should have set the .compilerc electron version to be a float', async () => {
        const compilerc = JSON.parse(await fs.readFile(path.resolve(dir, '.compilerc')));
        expect(compilerc.env.development['application/javascript'].presets[0][1].targets.electron).to.be.a('number');
      });

      describe('lint', () => {
        it('should initially pass the linting process', () => forge.lint({ dir }));
      });

      after(() => fs.remove(dir));
    });
  };
  forLintingMethod('airbnb');
  forLintingMethod('standard');

  describe('init (with custom templater)', () => {
    let dir;

    before(async () => {
      dir = path.resolve(os.tmpdir(), `electron-forge-test-${dirID}`);
      dirID += 1;
      await fs.remove(dir);
      execSync('npm link', {
        cwd: path.resolve(__dirname, '../fixture/custom_init'),
      });
      await forge.init({
        dir,
        template: 'dummy',
      });
    });

    it('should create dot files correctly', async () => {
      expect(await fs.exists(dir), 'the target dir should have been created').to.equal(true);
      expect(await fs.exists(path.resolve(dir, '.bar')), 'the .bar file should exist').to.equal(true);
    });

    it('should create deep files correctly', async () => {
      expect(await fs.exists(path.resolve(dir, 'src/foo.js')), 'the src/foo.js file should exist').to.equal(true);
    });

    describe('lint', () => {
      it('should initially pass the linting process', () => forge.lint({ dir }));
    });

    after(async () => {
      await fs.remove(dir);
      execSync('npm unlink', {
        cwd: path.resolve(__dirname, '../fixture/custom_init'),
      });
    });
  });

  describe('init (with built-in templater)', () => {
    let dir;

    before(async () => {
      dir = path.resolve(os.tmpdir(), `electron-forge-test-${dirID}`);
      dirID += 1;
      await fs.remove(dir);
    });

    it('should succeed in initializing', async () => {
      await forge.init({
        dir,
        template: 'react-typescript',
      });
    });

    it('should succeed in initializing an already initialized directory', async () => {
      await forge.init({
        dir,
        template: 'react-typescript',
      });
    });

    it('should add a dependency on react', async () => {
      expect(Object.keys(require(path.resolve(dir, 'package.json')).dependencies)).to.contain('react');
    });

    after(async () => {
      await fs.remove(dir);
    });
  });

  describe('init (with a nonexistent templater)', () => {
    let dir;

    before(async () => {
      dir = path.resolve(os.tmpdir(), `electron-forge-test-${dirID}`);
      dirID += 1;
      await fs.remove(dir);
    });

    it('should fail in initializing', async () => {
      await expect(forge.init({
        dir,
        template: 'does-not-exist',
      })).to.eventually.be.rejectedWith('Failed to locate custom template');
    });

    after(async () => {
      await fs.remove(dir);
    });
  });

  describe('after init', () => {
    let dir;

    before(async () => {
      dir = path.resolve(os.tmpdir(), `electron-forge-test-${dirID}/electron-forge-test`);
      dirID += 1;
      await forge.init({ dir });

      const packageJSON = await readPackageJSON(dir);
      packageJSON.name = 'testapp';
      packageJSON.productName = 'Test App';
      packageJSON.config.forge.electronPackagerConfig.asar = false;
      packageJSON.config.forge.windowsStoreConfig.packageName = 'TestApp';
      packageJSON.homepage = 'http://www.example.com/';
      packageJSON.author = 'Test Author';
      await fs.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON, null, 2));
    });

    it('can package to outDir without errors', async () => {
      const outDir = `${dir}/foo`;

      expect(await fs.exists(outDir)).to.equal(false);

      await forge.package({ dir, outDir });

      expect(await fs.exists(outDir)).to.equal(true);
    });

    it('can make from custom outDir without errors', async () => {
      const packageJSON = await readPackageJSON(dir);
      packageJSON.config.forge.make_targets[process.platform] = ['zip'];
      await fs.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON));

      await forge.make({ dir, skipPackage: true, outDir: `${dir}/foo` });

      // Cleanup here to ensure things dont break in the make tests
      await fs.remove(path.resolve(dir, 'foo'));
      await fs.remove(path.resolve(dir, 'out'));
    });

    it('can package without errors with native pre-gyp deps installed', async () => {
      await installDeps(dir, ['ref']);
      await forge.package({ dir });
      await fs.remove(path.resolve(dir, 'node_modules/ref'));
    });

    it('can package without errors', async () => {
      await forge.package({ dir });
    });

    describe('after package', () => {
      let resourcesPath = 'Test App.app/Contents/Resources';
      if (process.platform !== 'darwin') {
        resourcesPath = 'resources';
      }

      it('should have deleted the forge config from the packaged app', async () => {
        const cleanPackageJSON = await readPackageJSON(
          path.resolve(dir, 'out', `Test App-${process.platform}-${process.arch}`, resourcesPath, 'app')
        );
        expect(cleanPackageJSON).to.not.have.deep.property('config.forge');
      });

      it('should not affect the actual forge config', async () => {
        const normalPackageJSON = await readPackageJSON(dir);
        expect(normalPackageJSON).to.have.deep.property('config.forge');
      });

      let targets = [];
      if (fs.existsSync(path.resolve(__dirname, `../../src/makers/${process.platform}`))) {
        targets = fs.readdirSync(path.resolve(__dirname, `../../src/makers/${process.platform}`)).map(file => path.parse(file).name);
      }
      const genericTargets = fs.readdirSync(path.resolve(__dirname, '../../src/makers/generic')).map(file => path.parse(file).name);

      const testMakeTarget = function testMakeTarget(target, shouldPass, ...options) {
        describe(`make (with target=${target})`, async () => {
          before(async () => {
            const packageJSON = await readPackageJSON(dir);
            packageJSON.config.forge.make_targets[process.platform] = [target];
            await fs.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON));
          });

          options.forEach((optionsFetcher) => {
            if (shouldPass) {
              it(`successfully makes for config: ${JSON.stringify(optionsFetcher(), 2)}`, async () => {
                await forge.make(optionsFetcher());
              });
            } else {
              it(`fails for config: ${JSON.stringify(optionsFetcher(), 2)}`, async () => {
                await expect(forge.make(optionsFetcher())).to.eventually.be.rejected;
              });
            }
          });
        });
      };

      [].concat(targets).concat(genericTargets).forEach((target) => {
        const testOptions = [() => ({ dir, skipPackage: true })];
        testMakeTarget(target, true, ...testOptions);
      });

      testMakeTarget('zip', true, { dir, skipPackage: true, outDir: `${dir}/foo` });

      const dummyMakerPath = `${process.cwd()}/test/fixture/dummy-maker`;
      testMakeTarget('dummy', false, {
        dir,
        overrideTargets: [dummyMakerPath],
        platform: process.platform === 'darwin' ? 'linux' : 'darwin',
        skipPackage: true,
      });
    });

    after(() => fs.remove(dir));
  });
});

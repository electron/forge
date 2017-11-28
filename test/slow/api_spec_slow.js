import { execSync } from 'child_process';
import asar from 'asar';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

import { createDefaultCertificate } from '../../src/makers/win32/appx';
import installDeps from '../../src/util/install-dependencies';
import readPackageJSON from '../../src/util/read-package-json';
import yarnOrNpm from '../../src/util/yarn-or-npm';

const nodeInstallerArg = process.argv.find(arg => arg.startsWith('--installer=')) || `--installer=${yarnOrNpm()}`;
const nodeInstaller = nodeInstallerArg.substr(12);
const forge = proxyquire.noCallThru().load('../../src/api', {
  './install': async () => {},
});

describe(`electron-forge API (with nodeInstaller=${nodeInstaller})`, () => {
  let dir;
  let dirID = Date.now();

  const ensureTestDirIsNonexistent = async () => {
    dir = path.resolve(os.tmpdir(), `electron-forge-test-${dirID}`);
    dirID += 1;
    await fs.remove(dir);
  };

  const beforeInitTest = (params, beforeInit) => {
    before(async () => {
      await ensureTestDirIsNonexistent();
      if (beforeInit) {
        beforeInit();
      }
      await forge.init(Object.assign({}, params, { dir }));
    });
  };

  const expectProjectPathExists = async (subPath, pathType) => {
    expect(await fs.pathExists(path.resolve(dir, subPath)), `the ${subPath} ${pathType} should exist`).to.equal(true);
  };

  const forLintingMethod = (lintStyle) => {
    describe(`init (with lintStyle=${lintStyle})`, () => {
      beforeInitTest({ lintStyle });

      it('should create a new folder with a npm module inside', async () => {
        expect(await fs.pathExists(dir), 'the target dir should have been created').to.equal(true);
        expectProjectPathExists('package.json', 'file');
      });

      it('should have initialized a git repository', async () => {
        expectProjectPathExists('.git', 'folder');
      });

      it('should have installed the initial node_modules', async () => {
        expectProjectPathExists('node_modules', 'folder');
        expect(await fs.pathExists(path.resolve(dir, 'node_modules/electron-prebuilt-compile')), 'electron-prebuilt-compile should exist').to.equal(true);
        expect(await fs.pathExists(path.resolve(dir, 'node_modules/babel-core')), 'babel-core should exist').to.equal(true);
        expect(await fs.pathExists(path.resolve(dir, 'node_modules/electron-forge')), 'electron-forge should exist').to.equal(true);
      });

      it('should have set the .compilerc electron version to be a float', async () => {
        expectProjectPathExists('.compilerc', 'file');
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

  describe('init with CI files enabled', () => {
    beforeInitTest({ copyCIFiles: true });

    it('should copy over the CI config files correctly', async () => {
      expect(await fs.pathExists(dir), 'the target dir should have been created').to.equal(true);
      expectProjectPathExists('.appveyor.yml', 'file');
      expectProjectPathExists('.travis.yml', 'file');
    });
  });

  describe('init (with custom templater)', () => {
    beforeInitTest({ template: 'dummy' }, () => {
      execSync('npm link', {
        cwd: path.resolve(__dirname, '../fixture/custom_init'),
      });
    });

    it('should create dot files correctly', async () => {
      expect(await fs.pathExists(dir), 'the target dir should have been created').to.equal(true);
      expectProjectPathExists('.bar', 'file');
    });

    it('should create deep files correctly', async () => {
      expectProjectPathExists('src/foo.js', 'file');
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
    before(ensureTestDirIsNonexistent);

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
    before(ensureTestDirIsNonexistent);

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

  describe('import', () => {
    before(async () => {
      await ensureTestDirIsNonexistent();
      await fs.mkdir(dir);
      execSync(`${nodeInstaller} init -y`, {
        cwd: dir,
      });
    });

    it('works', async () => {
      await forge.import({ dir });
    });
  });

  describe('after init', () => {
    before(async () => {
      dir = path.resolve(os.tmpdir(), `electron-forge-test-${dirID}/electron-forge-test`);
      dirID += 1;
      await forge.init({ dir });

      const packageJSON = await readPackageJSON(dir);
      packageJSON.name = 'testapp';
      packageJSON.productName = 'Test App';
      packageJSON.config.forge.electronPackagerConfig.asar = false;
      packageJSON.config.forge.windowsStoreConfig.packageName = 'TestApp';
      if (process.platform === 'win32') {
        await fs.copy(
          path.join(__dirname, '..', 'fixture', 'bogus-private-key.pvk'),
          path.join(dir, 'default.pvk')
        );
        packageJSON.config.forge.windowsStoreConfig.devCert = await createDefaultCertificate(
          'CN=Test Author',
          { certFilePath: dir }
        );
      }
      packageJSON.homepage = 'http://www.example.com/';
      packageJSON.author = 'Test Author';
      await fs.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON, null, 2));
    });

    it('can package to outDir without errors', async () => {
      const outDir = `${dir}/foo`;

      expect(await fs.pathExists(outDir)).to.equal(false);

      await forge.package({ dir, outDir });

      expect(await fs.pathExists(outDir)).to.equal(true);
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
      const packageJSON = await readPackageJSON(dir);
      packageJSON.config.forge.electronPackagerConfig.asar = true;
      await fs.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON, null, 2));

      await forge.package({ dir });
    });

    describe('after package', () => {
      let resourcesPath = 'Test App.app/Contents/Resources';
      if (process.platform !== 'darwin') {
        resourcesPath = 'resources';
      }

      it('should have deleted the forge config from the packaged app', async () => {
        const cleanPackageJSON = JSON.parse(asar.extractFile(
          path.resolve(dir, 'out', `Test App-${process.platform}-${process.arch}`, resourcesPath, 'app.asar'),
          'package.json'
        ));
        expect(cleanPackageJSON).to.not.have.nested.property('config.forge');
      });

      it('should not affect the actual forge config', async () => {
        const normalPackageJSON = await readPackageJSON(dir);
        expect(normalPackageJSON).to.have.nested.property('config.forge');
      });

      function getMakers(platform) {
        return fs.readdirSync(path.resolve(__dirname, `../../src/makers/${platform}`)).map(file => path.parse(file).name).filter(name => name !== 'flatpak');
      }

      const goodMakers = [...getMakers(process.platform), ...getMakers('generic')];
      const badPlatforms = ['darwin', 'linux', 'win32'].filter(p => p !== process.platform);
      const badMakers = [];
      badPlatforms.forEach(platform => badMakers.push(...getMakers(platform)));

      const testMakeTarget = function testMakeTarget(target, shouldPass, ...options) {
        describe(`make (with target=${target})`, async () => {
          before(async () => {
            const packageJSON = await readPackageJSON(dir);
            packageJSON.config.forge.make_targets[process.platform] = [target];
            await fs.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON));
          });

          for (const optionsFetcher of options) {
            if (shouldPass) {
              it(`successfully makes for config: ${JSON.stringify(optionsFetcher(), 2)}`, async () => {
                const outputs = await forge.make(optionsFetcher());
                for (const outputResult of outputs) {
                  for (const output of outputResult.artifacts) {
                    expect(await fs.exists(output)).to.equal(true);
                  }
                }
              });
            } else {
              it(`fails for config: ${JSON.stringify(optionsFetcher(), 2)}`, async () => {
                await expect(forge.make(optionsFetcher())).to.eventually.be.rejected;
              });
            }
          }
        });
      };

      const targetOptionFetcher = () => ({ dir, skipPackage: true });
      for (const maker of goodMakers) {
        testMakeTarget(maker, true, targetOptionFetcher);
      }

      for (const maker of badMakers) {
        testMakeTarget(maker, false, targetOptionFetcher);
      }

      describe('make', () => {
        it('throws an error when given an unrecognized platform', async () => {
          await expect(forge.make({ dir, platform: 'dos' })).to.eventually.be.rejectedWith(/invalid platform/);
        });

        it('throws an error when the specified maker doesn\'t support the current platform', async () => {
          const makerPath = `${process.cwd()}/test/fixture/maker-unsupported`;
          await expect(forge.make({
            dir,
            overrideTargets: [makerPath],
            skipPackage: true,
          })).to.eventually.be.rejectedWith(/the maker declared that it cannot run/);
        });

        it('throws an error when the specified maker doesn\'t implement isSupportedOnCurrentPlatform()', async () => {
          const makerPath = `${process.cwd()}/test/fixture/maker-incompatible`;
          await expect(forge.make({
            dir,
            overrideTargets: [makerPath],
            skipPackage: true,
          })).to.eventually.be.rejectedWith(/incompatible with this version/);
        });

        it('can make for the MAS platform successfully', async () => {
          if (process.platform !== 'darwin') return;
          await expect(forge.make({
            dir,
            overrideTargets: ['zip', 'dmg'],
            platform: 'mas',
          })).to.eventually.have.length(2);
        });
      });
    });

    after(() => fs.remove(dir));
  });
});

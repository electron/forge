import { execSync } from 'child_process';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

import { createDefaultCertificate } from '@electron-forge/maker-appx';
import installDeps from '../../src/util/install-dependencies';
import { readRawPackageJson } from '../../src/util/read-package-json';
import yarnOrNpm from '../../src/util/yarn-or-npm';
import { InitOptions } from '../../src/api';

const asar = require('asar');

const nodeInstallerArg = process.argv.find((arg) => arg.startsWith('--installer=')) || `--installer=${yarnOrNpm()}`;
const nodeInstaller = nodeInstallerArg.substr(12);
const forge = proxyquire.noCallThru().load('../../src/api', {
  './install': async () => {},
}).api;

describe(`electron-forge API (with installer=${nodeInstaller})`, () => {
  let dir: string;
  let dirID = Date.now();

  const ensureTestDirIsNonexistent = async () => {
    dir = path.resolve(os.tmpdir(), `electron-forge-test-${dirID}`);
    dirID += 1;
    await fs.remove(dir);
  };

  const beforeInitTest = (params?: Partial<InitOptions>, beforeInit?: Function) => {
    before(async () => {
      await ensureTestDirIsNonexistent();
      if (beforeInit) {
        beforeInit();
      }
      await forge.init({ ...params, dir });
    });
  };

  const expectProjectPathExists = async (subPath: string, pathType: string, exists = true) => {
    expect(await fs.pathExists(path.resolve(dir, subPath)), `the ${subPath} ${pathType} should exist`).to.equal(exists);
  };

  const expectProjectPathNotExists = async (subPath: string, pathType: string) => {
    await expectProjectPathExists(subPath, pathType, false);
  };

  describe('init', () => {
    beforeInitTest();

    it('should create a new folder with a npm module inside', async () => {
      expect(await fs.pathExists(dir), 'the target dir should have been created').to.equal(true);
      await expectProjectPathExists('package.json', 'file');
    });

    it('should have initialized a git repository', async () => {
      await expectProjectPathExists('.git', 'folder');
    });

    it('should have installed the initial node_modules', async () => {
      await expectProjectPathExists('node_modules', 'folder');
      expect(await fs.pathExists(path.resolve(dir, 'node_modules/electron')), 'electron should exist').to.equal(true);
      expect(await fs.pathExists(path.resolve(dir, 'node_modules/electron-squirrel-startup')), 'electron-squirrel-startup should exist').to.equal(true);
      expect(await fs.pathExists(path.resolve(dir, 'node_modules/@electron-forge/cli')), '@electron-forge/cli should exist').to.equal(true);
    });

    describe('lint', () => {
      it('should initially pass the linting process', () => forge.lint({ dir }));
    });

    after(() => fs.remove(dir));
  });

  describe('init with CI files enabled', () => {
    beforeInitTest({ copyCIFiles: true });

    it('should copy over the CI config files correctly', async () => {
      expect(await fs.pathExists(dir), 'the target dir should have been created').to.equal(true);
      await expectProjectPathExists('.appveyor.yml', 'file');
      await expectProjectPathExists('.travis.yml', 'file');
    });
  });

  describe('init (with custom templater)', () => {
    beforeInitTest({ template: path.resolve(__dirname, '../fixture/custom_init') });

    it('should create dot files correctly', async () => {
      expect(await fs.pathExists(dir), 'the target dir should have been created').to.equal(true);
      await expectProjectPathExists('.bar', 'file');
    });

    it('should create deep files correctly', async () => {
      await expectProjectPathExists('src/foo.js', 'file');
      await expectProjectPathExists('src/index.html', 'file');
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

    it('should succeed in initializing the webpack template', async () => {
      await forge.init({
        dir,
        template: 'webpack',
      });
    });

    it('should succeed in initializing the typescript template', async () => {
      await fs.remove(dir);

      await forge.init({
        dir,
        template: 'typescript',
      });
    });

    it('should fail in initializing an already initialized directory', async () => {
      await expect(forge.init({
        dir,
        template: 'webpack',
      })).to.eventually.be.rejected;
    });

    it('should initialize an already initialized directory when forced to', async () => {
      await forge.init({
        dir,
        force: true,
        template: 'webpack',
      });
    });

    it('should add a devDependency on @electron-forge/plugin-webpack', async () => {
      expect(Object.keys(require(path.resolve(dir, 'package.json')).devDependencies)).to.contain('@electron-forge/plugin-webpack');
    });

    it('should copy the appropriate template files', async () => {
      const expectedFiles = [
        'webpack.main.config.js',
        'webpack.renderer.config.js',
        'webpack.rules.js',
        path.join('src', 'renderer.js'),
      ];
      for (const filename of expectedFiles) {
        await expectProjectPathExists(filename, 'file');
      }
    });

    it('should move and rewrite the main process file', async () => {
      await expectProjectPathNotExists(path.join('src', 'index.js'), 'file');
      await expectProjectPathExists(path.join('src', 'main.js'), 'file');
      expect((await fs.readFile(path.join(dir, 'src', 'main.js'))).toString()).to.match(/MAIN_WINDOW_WEBPACK_ENTRY/);
    });

    it('should remove the stylesheet link from the HTML file', async () => {
      expect((await fs.readFile(path.join(dir, 'src', 'index.html'))).toString()).to.not.match(/link rel="stylesheet"/);
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

    it('creates a forge config', async () => {
      const packageJSON = await readRawPackageJson(dir);
      packageJSON.name = 'Name';
      packageJSON.productName = 'Product Name';
      packageJSON.customProp = 'propVal';
      await fs.writeJson(path.resolve(dir, 'package.json'), packageJSON);

      await forge.import({ dir });

      const {
        config: {
          forge: {
            makers: [
              {
                config: {
                  name: winstallerName,
                },
              },
            ],
          },
        },
        customProp,
      } = await readRawPackageJson(dir);

      expect(winstallerName).to.equal('Name');
      expect(customProp).to.equal('propVal');
    });

    after(async () => {
      await fs.remove(dir);
    });
  });

  describe('after init', () => {
    let devCert: string;

    before(async () => {
      dir = path.resolve(os.tmpdir(), `electron-forge-test-${dirID}/electron-forge-test`);
      dirID += 1;
      await forge.init({ dir });

      const packageJSON = await readRawPackageJson(dir);
      packageJSON.name = 'testapp';
      packageJSON.version = '1.0.0-beta.1';
      packageJSON.productName = 'Test-App';
      packageJSON.config.forge.packagerConfig.asar = false;
      if (process.platform === 'win32') {
        await fs.copy(
          path.join(__dirname, '..', 'fixture', 'bogus-private-key.pvk'),
          path.join(dir, 'default.pvk'),
        );
        devCert = await createDefaultCertificate(
          'CN=Test Author',
          { certFilePath: dir },
        );
      } else if (process.platform === 'linux') {
        packageJSON.config.forge.packagerConfig.executableName = 'testapp';
      }
      packageJSON.homepage = 'http://www.example.com/';
      packageJSON.author = 'Test Author';
      await fs.writeJson(path.resolve(dir, 'package.json'), packageJSON);
    });

    it('throws an error when all is set', async () => {
      let packageJSON = await readRawPackageJson(dir);
      packageJSON.config.forge.packagerConfig.all = true;
      await fs.writeJson(path.join(dir, 'package.json'), packageJSON);
      await expect(forge.package({ dir })).to.eventually.be.rejectedWith(/packagerConfig\.all is not supported by Electron Forge/);
      packageJSON = await readRawPackageJson(dir);
      delete packageJSON.config.forge.packagerConfig.all;
      await fs.writeJson(path.join(dir, 'package.json'), packageJSON);
    });

    it('can package to outDir without errors', async () => {
      const outDir = `${dir}/foo`;

      expect(await fs.pathExists(outDir)).to.equal(false);

      await forge.package({ dir, outDir });

      expect(await fs.pathExists(outDir)).to.equal(true);
    });

    it('can make from custom outDir without errors', async () => {
      const packageJSON = await readRawPackageJson(dir);
      packageJSON.config.forge.makers = [{ name: require.resolve('@electron-forge/maker-zip') }];
      await fs.writeJson(path.resolve(dir, 'package.json'), packageJSON);

      await forge.make({ dir, skipPackage: true, outDir: `${dir}/foo` });

      // Cleanup here to ensure things dont break in the make tests
      await fs.remove(path.resolve(dir, 'foo'));
      await fs.remove(path.resolve(dir, 'out'));
    });

    it('can package without errors with native pre-gyp deps installed', async () => {
      await installDeps(dir, ['ref-napi']);
      await forge.package({ dir });
      await fs.remove(path.resolve(dir, 'node_modules/ref-napi'));
    });

    it('can package without errors', async () => {
      const packageJSON = await readRawPackageJson(dir);
      delete packageJSON.dependencies['ref-napi'];
      packageJSON.config.forge.packagerConfig.asar = true;
      await fs.writeJson(path.resolve(dir, 'package.json'), packageJSON);

      await forge.package({ dir });
    });

    describe('after package', () => {
      let resourcesPath = 'Test-App.app/Contents/Resources';
      if (process.platform !== 'darwin') {
        resourcesPath = 'resources';
      }

      it('should have deleted the forge config from the packaged app', async () => {
        const cleanPackageJSON = JSON.parse(asar.extractFile(
          path.resolve(dir, 'out', `Test-App-${process.platform}-${process.arch}`, resourcesPath, 'app.asar'),
          'package.json',
        ));
        expect(cleanPackageJSON).to.not.have.nested.property('config.forge');
      });

      it('should not affect the actual forge config', async () => {
        const normalPackageJSON = await readRawPackageJson(dir);
        expect(normalPackageJSON).to.have.nested.property('config.forge');
      });

      if (process.platform !== 'win32') {
        process.env.DISABLE_SQUIRREL_TEST = 'true';
      }

      function getMakers(good: boolean) {
        const allMakers = [
          '@electron-forge/maker-appx',
          '@electron-forge/maker-deb',
          '@electron-forge/maker-dmg',
          '@electron-forge/maker-flatpak',
          '@electron-forge/maker-rpm',
          '@electron-forge/maker-snap',
          '@electron-forge/maker-squirrel',
          '@electron-forge/maker-wix',
          '@electron-forge/maker-zip',
        ];
        return allMakers.map((maker) => require.resolve(maker))
          .filter((makerPath) => {
            const MakerClass = require(makerPath).default;
            const maker = new MakerClass();
            return maker.isSupportedOnCurrentPlatform() === good
              && maker.externalBinariesExist() === good;
          })
          .map((makerPath) => () => {
            const makerDefinition = {
              name: makerPath,
              platforms: [process.platform],
              config: {
                devCert,
              },
            };

            if (process.platform === 'win32') {
              (makerDefinition.config as any).makeVersionWinStoreCompatible = true;
            }

            return makerDefinition;
          });
      }

      const goodMakers = getMakers(true);
      const badMakers = getMakers(false);

      const testMakeTarget = function testMakeTarget(
        target: () => { name: string },
        shouldPass: boolean,
        ...options: any[]
      ) {
        describe(`make (with target=${path.basename(target().name)})`, async () => {
          before(async () => {
            const packageJSON = await readRawPackageJson(dir);
            packageJSON.config.forge.makers = [target()];
            await fs.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON));
          });

          for (const optionsFetcher of options) {
            if (shouldPass) {
              // eslint-disable-next-line no-loop-func
              it(`successfully makes for config: ${JSON.stringify(optionsFetcher())}`, async () => {
                const outputs = await forge.make(optionsFetcher());
                for (const outputResult of outputs) {
                  for (const output of outputResult.artifacts) {
                    expect(await fs.pathExists(output)).to.equal(true);
                    expect(output.startsWith(path.resolve(dir, 'out', 'make'))).to.equal(true);
                  }
                }
              });
            } else {
              it(`fails for config: ${JSON.stringify(optionsFetcher())}`, async () => {
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
          const makerPath = path.resolve(__dirname, '../fixture/maker-unsupported');
          await expect(forge.make({
            dir,
            overrideTargets: [{
              name: makerPath,
            }],
            skipPackage: true,
          })).to.eventually.be.rejectedWith(/the maker declared that it cannot run/);
        });

        it('throws an error when the specified maker doesn\'t implement isSupportedOnCurrentPlatform()', async () => {
          const makerPath = path.resolve(__dirname, '../fixture/maker-incompatible');
          await expect(forge.make({
            dir,
            overrideTargets: [{
              name: makerPath,
            }],
            skipPackage: true,
          })).to.eventually.be.rejectedWith(/incompatible with this version/);
        });

        it('can make for the MAS platform successfully', async () => {
          if (process.platform !== 'darwin') return;
          await expect(forge.make({
            dir,
            overrideTargets: [require.resolve('@electron-forge/maker-zip'), require.resolve('@electron-forge/maker-dmg')],
            platform: 'mas',
          })).to.eventually.have.length(2);
        });
      });
    });

    after(() => fs.remove(dir));
  });
});

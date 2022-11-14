import assert from 'assert';
import { execSync } from 'child_process';
import path from 'path';

import { createDefaultCertificate } from '@electron-forge/maker-appx';
import { ForgeConfig, IForgeResolvableMaker } from '@electron-forge/shared-types';
import { ensureTestDirIsNonexistent, expectLintToPass, expectProjectPathExists } from '@electron-forge/test-utils';
import { expect } from 'chai';
import { readMetadata } from 'electron-installer-common';
import fs from 'fs-extra';
import proxyquire from 'proxyquire';

import { InitOptions } from '../../src/api';
import installDeps from '../../src/util/install-dependencies';
import { readRawPackageJson } from '../../src/util/read-package-json';

const forge = proxyquire.noCallThru().load('../../src/api', {
  './install': async () => {
    /* don't load the install module for this spec */
  },
}).api;

type BeforeInitFunction = () => void;
type PackageJSON = Record<string, unknown> & {
  config: {
    forge: ForgeConfig;
  };
  dependencies: Record<string, string>;
};

async function updatePackageJSON(dir: string, packageJSONUpdater: (packageJSON: PackageJSON) => Promise<void>) {
  const packageJSON = await readRawPackageJson(dir);
  await packageJSONUpdater(packageJSON);
  await fs.writeJson(path.resolve(dir, 'package.json'), packageJSON);
}

for (const nodeInstaller of ['npm', 'yarn']) {
  process.env.NODE_INSTALLER = nodeInstaller;
  describe(`electron-forge API (with installer=${nodeInstaller})`, () => {
    let dir: string;

    const beforeInitTest = (params?: Partial<InitOptions>, beforeInit?: BeforeInitFunction) => {
      before(async () => {
        dir = await ensureTestDirIsNonexistent();
        if (beforeInit) {
          beforeInit();
        }
        await forge.init({ ...params, dir });
      });
    };

    describe('init', () => {
      beforeInitTest();

      it('should fail in initializing an already initialized directory', async () => {
        await expect(forge.init({ dir })).to.eventually.be.rejected;
      });

      it('should initialize an already initialized directory when forced to', async () => {
        await forge.init({
          dir,
          force: true,
        });
      });

      it('should create a new folder with a npm module inside', async () => {
        expect(await fs.pathExists(dir), 'the target dir should have been created').to.equal(true);
        await expectProjectPathExists(dir, 'package.json', 'file');
      });

      it('should have initialized a git repository', async () => {
        await expectProjectPathExists(dir, '.git', 'folder');
      });

      it('should have installed the initial node_modules', async () => {
        await expectProjectPathExists(dir, 'node_modules', 'folder');
        expect(await fs.pathExists(path.resolve(dir, 'node_modules/electron')), 'electron should exist').to.equal(true);
        expect(await fs.pathExists(path.resolve(dir, 'node_modules/electron-squirrel-startup')), 'electron-squirrel-startup should exist').to.equal(true);
        expect(await fs.pathExists(path.resolve(dir, 'node_modules/@electron-forge/cli')), '@electron-forge/cli should exist').to.equal(true);
      });

      it('should create a forge.config.js', async () => {
        await expectProjectPathExists(dir, 'forge.config.js', 'file');
      });

      describe('lint', () => {
        it('should initially pass the linting process', () => expectLintToPass(dir));
      });

      after(() => fs.remove(dir));
    });

    describe.skip('init with CI files enabled', () => {
      beforeInitTest({ copyCIFiles: true });

      it('should copy over the CI config files correctly', async () => {
        expect(await fs.pathExists(dir), 'the target dir should have been created').to.equal(true);
        await expectProjectPathExists(dir, '.appveyor.yml', 'file');
        await expectProjectPathExists(dir, '.travis.yml', 'file');
      });
    });

    describe('init (with custom templater)', () => {
      beforeInitTest({ template: path.resolve(__dirname, '../fixture/custom_init') });

      it('should add custom dependencies', async () => {
        expect(Object.keys(require(path.resolve(dir, 'package.json')).dependencies)).to.contain('debug');
      });

      it('should add custom devDependencies', async () => {
        expect(Object.keys(require(path.resolve(dir, 'package.json')).devDependencies)).to.contain('lodash');
      });

      it('should create dot files correctly', async () => {
        expect(await fs.pathExists(dir), 'the target dir should have been created').to.equal(true);
        await expectProjectPathExists(dir, '.bar', 'file');
      });

      it('should create deep files correctly', async () => {
        await expectProjectPathExists(dir, 'src/foo.js', 'file');
        await expectProjectPathExists(dir, 'src/index.html', 'file');
      });

      describe('lint', () => {
        it('should initially pass the linting process', () => expectLintToPass(dir));
      });

      after(async () => {
        await fs.remove(dir);
        execSync('npm unlink -g', {
          cwd: path.resolve(__dirname, '../fixture/custom_init'),
        });
      });
    });

    describe('init (with a templater sans required Forge version)', () => {
      before(async () => {
        dir = await ensureTestDirIsNonexistent();
      });

      it('should fail in initializing', async () => {
        await expect(
          forge.init({
            dir,
            template: path.resolve(__dirname, '../fixture/template-sans-forge-version'),
          })
        ).to.eventually.be.rejectedWith(/it does not specify its required Forge version\.$/);
      });

      after(async () => {
        await fs.remove(dir);
      });
    });

    describe('init (with a templater with a non-matching Forge version)', () => {
      before(async () => {
        dir = await ensureTestDirIsNonexistent();
      });

      it('should fail in initializing', async () => {
        await expect(
          forge.init({
            dir,
            template: path.resolve(__dirname, '../fixture/template-nonmatching-forge-version'),
          })
        ).to.eventually.be.rejectedWith(/is not compatible with this version of Electron Forge/);
      });

      after(async () => {
        await fs.remove(dir);
      });
    });

    describe('init (with a nonexistent templater)', () => {
      before(async () => {
        dir = await ensureTestDirIsNonexistent();
      });

      it('should fail in initializing', async () => {
        await expect(
          forge.init({
            dir,
            template: 'does-not-exist',
          })
        ).to.eventually.be.rejectedWith('Failed to locate custom template');
      });

      after(async () => {
        await fs.remove(dir);
      });
    });

    describe('import', () => {
      before(async () => {
        dir = await ensureTestDirIsNonexistent();
        await fs.mkdir(dir);
        execSync(`${nodeInstaller} init -y`, {
          cwd: dir,
        });
      });

      it('creates a forge config', async () => {
        await updatePackageJSON(dir, async (packageJSON) => {
          packageJSON.name = 'Name';
          packageJSON.productName = 'Product Name';
          packageJSON.customProp = 'propVal';
        });

        await forge.import({ dir });

        const { customProp } = await readRawPackageJson(dir);

        expect(customProp).to.equal('propVal');
      });

      after(async () => {
        await fs.remove(dir);
      });
    });
  });
}

describe('Electron Forge API', () => {
  let dir: string;

  describe('after init', () => {
    let devCert: string;

    before(async () => {
      dir = path.join(await ensureTestDirIsNonexistent(), 'electron-forge-test');
      await forge.init({ dir });

      await updatePackageJSON(dir, async (packageJSON) => {
        packageJSON.name = 'testapp';
        packageJSON.version = '1.0.0-beta.1';
        packageJSON.productName = 'Test-App';
        packageJSON.config = packageJSON.config || {};
        packageJSON.config.forge = {
          ...packageJSON.config.forge,
          packagerConfig: {
            asar: false,
          },
        };
        if (process.platform === 'win32') {
          await fs.copy(path.join(__dirname, '..', 'fixture', 'bogus-private-key.pvk'), path.join(dir, 'default.pvk'));
          devCert = await createDefaultCertificate('CN=Test Author', { certFilePath: dir });
        } else if (process.platform === 'linux') {
          packageJSON.config.forge.packagerConfig = {
            ...packageJSON.config.forge.packagerConfig,
            executableName: 'testapp',
          };
        }
        packageJSON.homepage = 'http://www.example.com/';
        packageJSON.author = 'Test Author';
      });
    });

    it('throws an error when all is set', async () => {
      await updatePackageJSON(dir, async (packageJSON) => {
        assert(packageJSON.config.forge.packagerConfig);
        packageJSON.config.forge.packagerConfig.all = true;
      });
      await expect(forge.package({ dir })).to.eventually.be.rejectedWith(/packagerConfig\.all is not supported by Electron Forge/);
      await updatePackageJSON(dir, async (packageJSON) => {
        assert(packageJSON.config.forge.packagerConfig);
        delete packageJSON.config.forge.packagerConfig.all;
      });
    });

    it('can package to outDir without errors', async () => {
      const outDir = `${dir}/foo`;

      expect(await fs.pathExists(outDir)).to.equal(false);

      await forge.package({ dir, outDir });

      expect(await fs.pathExists(outDir)).to.equal(true);
    });

    it('can make from custom outDir without errors', async () => {
      await updatePackageJSON(dir, async (packageJSON) => {
        // eslint-disable-next-line node/no-missing-require
        packageJSON.config.forge.makers = [{ name: require.resolve('@electron-forge/maker-zip') } as IForgeResolvableMaker];
      });

      await forge.make({ dir, skipPackage: true, outDir: `${dir}/foo` });

      // Cleanup here to ensure things dont break in the make tests
      await fs.remove(path.resolve(dir, 'foo'));
      await fs.remove(path.resolve(dir, 'out'));
    });

    // FIXME(erickzhao): This test hangs on the electron-rebuild step
    // with Electron 19. It was tested to work on Electron 18.
    // see https://github.com/electron/forge/pull/2869
    describe.skip('with prebuilt native module deps installed', () => {
      before(async () => {
        await installDeps(dir, ['ref-napi']);
      });

      it('can package without errors', async () => {
        await forge.package({ dir });
      });

      after(async () => {
        await fs.remove(path.resolve(dir, 'node_modules/ref-napi'));
        await updatePackageJSON(dir, async (packageJSON) => {
          delete packageJSON.dependencies['ref-napi'];
        });
      });
    });

    it('can package without errors', async () => {
      await updatePackageJSON(dir, async (packageJSON) => {
        assert(packageJSON.config.forge.packagerConfig);
        packageJSON.config.forge.packagerConfig.asar = true;
      });

      await forge.package({ dir });
    });

    describe('after package', () => {
      it('should have deleted the forge config from the packaged app', async () => {
        const cleanPackageJSON = await readMetadata({
          src: path.resolve(dir, 'out', `Test-App-${process.platform}-${process.arch}`),
          logger: console.error,
        });
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
        return allMakers
          .map((maker) => require.resolve(maker))
          .filter((makerPath) => {
            const MakerClass = require(makerPath).default;
            const maker = new MakerClass();
            return maker.isSupportedOnCurrentPlatform() === good && maker.externalBinariesExist() === good;
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
              (makerDefinition.config as Record<string, unknown>).makeVersionWinStoreCompatible = true;
            }

            return makerDefinition;
          });
      }

      const goodMakers = getMakers(true);
      const badMakers = getMakers(false);

      const testMakeTarget = function testMakeTarget(
        target: () => { name: string },
        shouldPass: boolean,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...options: any[]
      ) {
        describe(`make (with target=${path.basename(path.dirname(target().name))})`, async () => {
          before(async () => {
            await updatePackageJSON(dir, async (packageJSON) => {
              packageJSON.config.forge.makers = [target() as IForgeResolvableMaker];
            });
          });

          for (const optionsFetcher of options) {
            if (shouldPass) {
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

        it("throws an error when the specified maker doesn't support the current platform", async () => {
          const makerPath = path.resolve(__dirname, '../fixture/maker-unsupported');
          await expect(
            forge.make({
              dir,
              overrideTargets: [
                {
                  name: makerPath,
                },
              ],
              skipPackage: true,
            })
          ).to.eventually.be.rejectedWith(/the maker declared that it cannot run/);
        });

        it("throws an error when the specified maker doesn't implement isSupportedOnCurrentPlatform()", async () => {
          const makerPath = path.resolve(__dirname, '../fixture/maker-incompatible');
          await expect(
            forge.make({
              dir,
              overrideTargets: [
                {
                  name: makerPath,
                },
              ],
              skipPackage: true,
            })
          ).to.eventually.be.rejectedWith(/incompatible with this version/);
        });

        it('throws an error when no makers are configured for the given platform', async () => {
          await expect(
            forge.make({
              dir,
              overrideTargets: [
                {
                  name: path.resolve(__dirname, '../fixture/maker-wrong-platform'),
                },
              ],
              platform: 'linux',
              skipPackage: true,
            })
          ).to.eventually.be.rejectedWith('Could not find any make targets configured for the "linux" platform.');
        });

        it('can make for the MAS platform successfully', async () => {
          if (process.platform !== 'darwin') return;
          await expect(
            forge.make({
              dir,
              // eslint-disable-next-line node/no-missing-require
              overrideTargets: [require.resolve('@electron-forge/maker-zip'), require.resolve('@electron-forge/maker-dmg')],
              platform: 'mas',
            })
          ).to.eventually.have.length(2);
        });
      });
    });

    after(() => fs.remove(dir));
  });
});

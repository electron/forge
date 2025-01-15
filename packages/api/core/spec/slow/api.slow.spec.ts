import assert from 'node:assert';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { yarnOrNpmSpawn } from '@electron-forge/core-utils';
import { createDefaultCertificate } from '@electron-forge/maker-appx';
import { ForgeConfig, IForgeResolvableMaker } from '@electron-forge/shared-types';
import { ensureTestDirIsNonexistent, expectLintToPass, expectProjectPathExists } from '@electron-forge/test-utils';
import { readMetadata } from 'electron-installer-common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { api, InitOptions } from '../../src/api';
import installDeps from '../../src/util/install-dependencies';
import { readRawPackageJson } from '../../src/util/read-package-json';

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
  await fs.promises.writeFile(path.resolve(dir, 'package.json'), JSON.stringify(packageJSON), 'utf-8');
}

describe.each([{ installer: 'npm' }, { installer: 'yarn' }])(`init (with $installer)`, { timeout: 60_000 }, ({ installer }) => {
  let dir: string;

  beforeAll(async () => {
    await yarnOrNpmSpawn(['run', 'link:prepare']);
    process.env.NODE_INSTALLER = installer;
  });

  const beforeInitTest = (params?: Partial<InitOptions>, beforeInit?: BeforeInitFunction) => {
    beforeAll(async () => {
      dir = await ensureTestDirIsNonexistent();
      if (beforeInit) {
        beforeInit();
      }
      await api.init({ ...params, dir });
    });
  };

  describe('init', () => {
    beforeInitTest();

    it('should fail in initializing an already initialized directory', async () => {
      await expect(api.init({ dir })).rejects.toThrow(
        `The specified path: "${dir}" is not empty.  Please ensure it is empty before initializing a new project`
      );
    });

    it('should initialize an already initialized directory when forced to', async () => {
      await api.init({
        dir,
        force: true,
      });
    });

    it('should create a new folder with a npm module inside', async () => {
      expect(fs.existsSync(dir), 'the target dir should have been created').to.equal(true);
      await expectProjectPathExists(dir, 'package.json', 'file');
    });

    it('should have initialized a git repository', async () => {
      await expectProjectPathExists(dir, '.git', 'folder');
    });

    it('should have installed the initial node_modules', async () => {
      await expectProjectPathExists(dir, 'node_modules', 'folder');
      expect(fs.existsSync(path.resolve(dir, 'node_modules/electron')), 'electron should exist').to.equal(true);
      expect(fs.existsSync(path.resolve(dir, 'node_modules/electron-squirrel-startup')), 'electron-squirrel-startup should exist').to.equal(true);
      expect(fs.existsSync(path.resolve(dir, 'node_modules/@electron-forge/cli')), '@electron-forge/cli should exist').to.equal(true);
    });

    it('should create a forge.config.js', async () => {
      await expectProjectPathExists(dir, 'forge.config.js', 'file');
    });

    describe('lint', () => {
      it('should initially pass the linting process', () => expectLintToPass(dir));
    });

    afterAll(() => fs.promises.rm(dir, { recursive: true, force: true }));
  });

  describe.skip('init with CI files enabled', () => {
    beforeInitTest({ copyCIFiles: true });

    it('should copy over the CI config files correctly', async () => {
      expect(fs.existsSync(dir), 'the target dir should have been created').to.equal(true);
      await expectProjectPathExists(dir, '.appveyor.yml', 'file');
      await expectProjectPathExists(dir, '.travis.yml', 'file');
    });
  });

  describe('init (with custom templater)', () => {
    beforeInitTest({ template: path.resolve(__dirname, '../fixture/custom_init') });

    it('should add custom dependencies', async () => {
      // eslint-disable-next-line node/no-unsupported-features/es-syntax
      const packageJSON = await import(path.resolve(dir, 'package.json'));
      expect(packageJSON.dependencies).toHaveProperty('debug');
    });

    it('should add custom devDependencies', async () => {
      // eslint-disable-next-line node/no-unsupported-features/es-syntax
      const packageJSON = await import(path.resolve(dir, 'package.json'));
      expect(packageJSON.devDependencies).toHaveProperty('lodash');
    });

    it('should create dot files correctly', async () => {
      expect(fs.existsSync(dir), 'the target dir should have been created').to.equal(true);
      await expectProjectPathExists(dir, '.bar', 'file');
    });

    it('should create deep files correctly', async () => {
      await expectProjectPathExists(dir, 'src/foo.js', 'file');
      await expectProjectPathExists(dir, 'src/index.html', 'file');
    });

    describe('lint', () => {
      it('should initially pass the linting process', () => expectLintToPass(dir));
    });

    afterAll(async () => {
      await fs.promises.rm(dir, { recursive: true, force: true });
      execSync('npm unlink -g', {
        cwd: path.resolve(__dirname, '../fixture/custom_init'),
      });
    });
  });

  describe('init (with a templater sans required Forge version)', () => {
    beforeAll(async () => {
      dir = await ensureTestDirIsNonexistent();
    });

    it('should fail in initializing', async () => {
      await expect(
        api.init({
          dir,
          template: path.resolve(__dirname, '../fixture/template-sans-forge-version'),
        })
      ).rejects.toThrow(/it does not specify its required Forge version\.$/);
    });

    afterAll(async () => {
      await fs.promises.rm(dir, { recursive: true, force: true });
    });
  });

  describe('init (with a templater with a non-matching Forge version)', () => {
    beforeAll(async () => {
      dir = await ensureTestDirIsNonexistent();
    });

    it('should fail in initializing', async () => {
      await expect(
        api.init({
          dir,
          template: path.resolve(__dirname, '../fixture/template-nonmatching-forge-version'),
        })
      ).rejects.toThrow(/is not compatible with this version of Electron Forge/);
    });

    afterAll(async () => {
      await fs.promises.rm(dir, { recursive: true, force: true });
    });
  });

  describe('init (with a nonexistent templater)', () => {
    beforeAll(async () => {
      dir = await ensureTestDirIsNonexistent();
    });

    it('should fail in initializing', async () => {
      await expect(
        api.init({
          dir,
          template: 'does-not-exist',
        })
      ).rejects.toThrow('Failed to locate custom template');
    });

    afterAll(async () => {
      await fs.promises.rm(dir, { recursive: true, force: true });
    });
  });

  describe('import', () => {
    beforeAll(async () => {
      dir = await ensureTestDirIsNonexistent();
      await fs.promises.mkdir(dir);
      execSync(`git clone https://github.com/electron/electron-quick-start.git . --quiet`, {
        cwd: dir,
      });
    });

    it('creates forge.config.js and is packageable', async () => {
      await updatePackageJSON(dir, async (packageJSON) => {
        packageJSON.name = 'Name';
        packageJSON.productName = 'ProductName';
      });

      await api.import({ dir });

      expect(fs.existsSync(path.join(dir, 'forge.config.js'))).to.equal(true);

      execSync(`${installer} install`, {
        cwd: dir,
      });

      await api.package({ dir });

      const outDirContents = fs.readdirSync(path.join(dir, 'out'));
      expect(outDirContents).to.have.length(1);
      expect(outDirContents[0]).to.equal(`ProductName-${process.platform}-${process.arch}`);
    });

    afterAll(async () => {
      await fs.promises.rm(dir, { recursive: true, force: true });
    });
  });

  afterAll(async () => {
    await yarnOrNpmSpawn(['run', 'link:remove']);
  });
});

describe('Electron Forge API', { timeout: 60_000 }, () => {
  let dir: string;

  beforeAll(async () => {
    await yarnOrNpmSpawn(['run', 'link:prepare']);
  });

  describe('after init', () => {
    let devCert: string;

    beforeAll(async () => {
      dir = path.join(await ensureTestDirIsNonexistent(), 'electron-forge-test');
      await api.init({ dir });

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
          await fs.promises.rename(path.join(__dirname, '..', 'fixture', 'bogus-private-key.pvk'), path.join(dir, 'default.pvk'));
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
      await expect(api.package({ dir })).rejects.toThrow(/packagerConfig\.all is not supported by Electron Forge/);
      await updatePackageJSON(dir, async (packageJSON) => {
        assert(packageJSON.config.forge.packagerConfig);
        delete packageJSON.config.forge.packagerConfig.all;
      });
    });

    it('can package to outDir without errors', async () => {
      const outDir = `${dir}/foo`;

      expect(fs.existsSync(outDir)).to.equal(false);

      await api.package({ dir, outDir });

      expect(fs.existsSync(outDir)).to.equal(true);
    });

    it('can make from custom outDir without errors', async () => {
      await updatePackageJSON(dir, async (packageJSON) => {
        // eslint-disable-next-line node/no-missing-require
        packageJSON.config.forge.makers = [{ name: require.resolve('@electron-forge/maker-zip') } as IForgeResolvableMaker];
      });

      await api.make({ dir, skipPackage: true, outDir: `${dir}/foo` });

      // Cleanup here to ensure things dont break in the make tests
      await fs.promises.rm(path.resolve(dir, 'foo'), { recursive: true, force: true });
      await fs.promises.rm(path.resolve(dir, 'out'), { recursive: true, force: true });
    });

    // FIXME(erickzhao): This test hangs on the electron-rebuild step
    // with Electron 19. It was tested to work on Electron 18.
    // see https://github.com/electron/forge/pull/2869
    describe.skip('with prebuilt native module deps installed', () => {
      beforeAll(async () => {
        await installDeps(dir, ['ref-napi']);
      });

      it('can package without errors', async () => {
        await api.package({ dir });
      });

      afterAll(async () => {
        await fs.promises.rm(path.resolve(dir, 'node_modules/ref-napi'), { recursive: true, force: true });
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

      await api.package({ dir });
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
            // eslint-disable-next-line @typescript-eslint/no-require-imports
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
        describe(`make (with target=${target().name})`, async () => {
          beforeAll(async () => {
            await updatePackageJSON(dir, async (packageJSON) => {
              packageJSON.config.forge.makers = [target() as IForgeResolvableMaker];
            });
          });

          for (const optionsFetcher of options) {
            if (shouldPass) {
              it(`successfully makes for config: ${JSON.stringify(optionsFetcher())}`, async () => {
                const outputs = await api.make(optionsFetcher());
                for (const outputResult of outputs) {
                  for (const output of outputResult.artifacts) {
                    expect(fs.existsSync(output)).to.equal(true);
                    expect(output.startsWith(path.resolve(dir, 'out', 'make'))).to.equal(true);
                  }
                }
              });
            } else {
              it(`fails for config: ${JSON.stringify(optionsFetcher())}`, async () => {
                await expect(api.make(optionsFetcher())).rejects.toThrow();
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
          await expect(api.make({ dir, platform: 'dos' })).rejects.toThrow(/invalid platform/);
        });

        it("throws an error when the specified maker doesn't support the current platform", async () => {
          const makerPath = path.resolve(__dirname, '../fixture/maker-unsupported');
          await expect(
            api.make({
              dir,
              overrideTargets: [
                {
                  name: makerPath,
                } as IForgeResolvableMaker,
              ],
              skipPackage: true,
            })
          ).rejects.toThrow(/the maker declared that it cannot run/);
        });

        it("throws an error when the specified maker doesn't implement isSupportedOnCurrentPlatform()", async () => {
          const makerPath = path.resolve(__dirname, '../fixture/maker-incompatible');
          await expect(
            api.make({
              dir,
              overrideTargets: [
                {
                  name: makerPath,
                } as IForgeResolvableMaker,
              ],
              skipPackage: true,
            })
          ).rejects.toThrow(/incompatible with this version/);
        });

        it('throws an error when no makers are configured for the given platform', async () => {
          await expect(
            api.make({
              dir,
              overrideTargets: [
                {
                  name: path.resolve(__dirname, '../fixture/maker-wrong-platform'),
                } as IForgeResolvableMaker,
              ],
              platform: 'linux',
              skipPackage: true,
            })
          ).rejects.toThrow('Could not find any make targets configured for the "linux" platform.');
        });

        it.runIf(process.platform === 'darwin')('can make for the MAS platform successfully', async () => {
          await expect(
            api.make({
              dir,
              // eslint-disable-next-line node/no-missing-require
              overrideTargets: [require.resolve('@electron-forge/maker-zip'), require.resolve('@electron-forge/maker-dmg')],
              platform: 'mas',
            })
          ).resolves.toHaveLength(2);
        });
      });
    });

    afterAll(() => fs.promises.rm(dir, { recursive: true, force: true }));
  });

  afterAll(async () => {
    await yarnOrNpmSpawn(['link:remove']);
  });
});

import assert from 'node:assert';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { PACKAGE_MANAGERS, spawnPackageManager } from '@electron-forge/core-utils';
import { createDefaultCertificate } from '@electron-forge/maker-appx';
import { ForgeConfig, IForgeResolvableMaker } from '@electron-forge/shared-types';
import { ensureTestDirIsNonexistent, expectLintToPass } from '@electron-forge/test-utils';
import { readMetadata } from 'electron-installer-common';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

// eslint-disable-next-line n/no-missing-import
import { api } from '../../src/api';
import installDeps from '../../src/util/install-dependencies';
import { readRawPackageJson } from '../../src/util/read-package-json';

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

describe.each([PACKAGE_MANAGERS['npm']])(`init (with $executable)`, (pm) => {
  let dir: string;

  beforeAll(async () => {
    await spawnPackageManager(pm, ['run', 'link:prepare']);

    if (pm.executable === 'pnpm') {
      await spawnPackageManager(pm, 'config set node-linker hoisted'.split(' '));
    }

    return async () => {
      await spawnPackageManager(pm, ['run', 'link:remove']);
      delete process.env.NODE_INSTALLER;
    };
  });

  describe('import', () => {
    let dir: string;
    beforeEach(async () => {
      dir = await ensureTestDirIsNonexistent();
      await fs.promises.mkdir(dir);
      execSync(`git clone https://github.com/electron/electron-quick-start.git . --quiet`, {
        cwd: dir,
      });

      return async () => {
        await fs.promises.rm(dir, { recursive: true, force: true });
      };
    });

    it('creates forge.config.js and can successfully package the application', async () => {
      await updatePackageJSON(dir, async (packageJSON) => {
        packageJSON.name = 'Name';
        packageJSON.productName = 'ProductName';
      });

      await api.import({ dir });

      expect(fs.existsSync(path.join(dir, 'forge.config.js'))).toEqual(true);

      await api.package({ dir });

      const outDirContents = fs.readdirSync(path.join(dir, 'out'));
      expect(outDirContents).toEqual([`ProductName-${process.platform}-${process.arch}`]);
    });
  });

  describe('init', () => {
    beforeEach(async () => {
      dir = await ensureTestDirIsNonexistent();
      return async () => {
        await fs.promises.rm(dir, { recursive: true, force: true });
      };
    });

    it('should successfully initialize a Forge project', async () => {
      await api.init({ dir });

      expect(fs.existsSync(dir), 'the target dir should have been created').toEqual(true);
      expect(fs.existsSync(path.join(dir, 'package.json'))).toEqual(true);
      expect(fs.existsSync(path.join(dir, '.git'))).toEqual(true);
      expect(fs.existsSync(path.resolve(dir, 'node_modules/electron')), 'electron should exist').toEqual(true);
      expect(fs.existsSync(path.resolve(dir, 'node_modules/electron-squirrel-startup')), 'electron-squirrel-startup should exist').toEqual(true);
      expect(fs.existsSync(path.resolve(dir, 'node_modules/@electron-forge/cli')), '@electron-forge/cli should exist').toEqual(true);
      expect(fs.existsSync(path.join(dir, 'forge.config.js'))).toEqual(true);
      await expectLintToPass(dir);
    });

    describe('when directory already exists', async () => {
      beforeEach(async () => {
        await fs.promises.mkdir(dir);
        await fs.promises.writeFile(path.resolve(dir, 'foo'), 'bar', 'utf-8');
      });

      it('should fail by default', async () => {
        await expect(api.init({ dir })).rejects.toThrow();
      });

      it('should successfully initialize if --force flag is on', async () => {
        await expect(api.init({ dir, force: true })).resolves.toBeUndefined();
      });
    });

    describe('with skipGit', () => {
      it('should not initialize a git repo if passed the skipGit option', async () => {
        await api.init({
          dir,
          skipGit: true,
        });
        expect(fs.existsSync(path.join(dir, '.git'))).toEqual(false);
      });
    });

    describe('with custom templates', () => {
      it('writes custom files correctly', async () => {
        await api.init({ template: path.resolve(__dirname, '../fixture/custom_init'), dir });

        // Dependencies should have been written properly
        const packageJSON = await import(path.resolve(dir, 'package.json'));
        expect(packageJSON.dependencies).toHaveProperty('debug');
        expect(packageJSON.devDependencies).toHaveProperty('lodash');

        // can write .dot files
        expect(fs.existsSync(path.join(dir, '.bar'))).toEqual(true);

        // can create files in subfolders
        expect(fs.existsSync(path.join(dir, 'src/foo.js'))).toBe(true);
        expect(fs.existsSync(path.join(dir, 'src/index.html'))).toBe(true);

        await expectLintToPass(dir);
      });

      it('fails if template does not specify a Forge version', async () => {
        await expect(
          api.init({
            dir,
            template: path.resolve(__dirname, '../fixture/template-sans-forge-version'),
          })
        ).rejects.toThrow(/it does not specify its required Forge version\.$/);
      });

      it('fails if template has a mismatched Forge version', async () => {
        await expect(
          api.init({
            dir,
            template: path.resolve(__dirname, '../fixture/template-nonmatching-forge-version'),
          })
        ).rejects.toThrow(/is not compatible with this version of Electron Forge/);
      });

      it('fail if template does not exist', async () => {
        await expect(
          api.init({
            dir,
            template: 'does-not-exist',
          })
        ).rejects.toThrow('Failed to locate custom template');
      });
    });
  });

  describe.only('after init', () => {
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

        if (process.platform === 'linux') {
          packageJSON.config.forge.packagerConfig = {
            ...packageJSON.config.forge.packagerConfig,
            executableName: 'testapp',
          };
        }
        packageJSON.homepage = 'http://www.example.com/';
        packageJSON.author = 'Test Author';
      });

      return async () => {
        await fs.promises.rm(dir, { recursive: true, force: true });
      };
    });

    describe('package', () => {
      it('throws an error when packagerConfig.all is set', async () => {
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

      it('can package without errors', async () => {
        await updatePackageJSON(dir, async (packageJSON) => {
          assert(packageJSON.config.forge.packagerConfig);
          packageJSON.config.forge.packagerConfig.asar = true;
        });

        await api.package({ dir });

        // If config.forge is set in package.json, it should not exist in the packaged app's package.json
        const cleanPackageJSON = await readMetadata({
          src: path.resolve(dir, 'out', `Test-App-${process.platform}-${process.arch}`),
          logger: console.error,
        });
        expect(cleanPackageJSON).not.toHaveProperty('config.forge');

        // However, it should remain in the original package.json
        const normalPackageJSON = await readRawPackageJson(dir);
        expect(normalPackageJSON).toHaveProperty('config.forge');
      });

      describe('with custom outDir', () => {
        it('should package to custom directory', async () => {
          const outDir = `${dir}/foo`;

          expect(fs.existsSync(outDir)).toEqual(false);

          await api.package({ dir, outDir });

          expect(fs.existsSync(outDir)).toEqual(true);
        });

        it('can make from custom directory', async () => {
          await updatePackageJSON(dir, async (packageJSON) => {
            // eslint-disable-next-line n/no-missing-require
            packageJSON.config.forge.makers = [{ name: require.resolve('@electron-forge/maker-zip') } as IForgeResolvableMaker];
          });

          await api.make({ dir, skipPackage: true, outDir: `${dir}/foo` });

          // Cleanup here to ensure things dont break in the make tests
          await fs.promises.rm(path.resolve(dir, 'foo'), { recursive: true, force: true });
          await fs.promises.rm(path.resolve(dir, 'out'), { recursive: true, force: true });
        });
      });

      describe('with prebuilt native module deps installed', () => {
        beforeAll(async () => {
          await installDeps(pm, dir, ['ref-napi']);

          return async () => {
            await fs.promises.rm(path.resolve(dir, 'node_modules/ref-napi'), { recursive: true, force: true });
            await updatePackageJSON(dir, async (packageJSON) => {
              delete packageJSON.dependencies['ref-napi'];
            });
          };
        });

        it('should succeed', async () => {
          await api.package({ dir });
        });
      });
    });

    describe('make', () => {
      let devCert: string;

      beforeAll(async () => {
        if (process.platform === 'win32') {
          await fs.promises.copyFile(path.join(__dirname, '..', 'fixture', 'bogus-private-key.pvk'), path.join(dir, 'default.pvk'));
          devCert = await createDefaultCertificate('CN=Test Author', { certFilePath: dir });
        }

        if (process.platform !== 'win32') {
          process.env.DISABLE_SQUIRREL_TEST = 'true';
        }
      });

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

      console.log({ good: goodMakers.map((m) => m().name), bad: badMakers.map((m) => m().name) });

      const testMakeTarget = (
        target: () => { name: string },
        shouldPass: boolean,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...options: any[]
      ) => {
        describe(`make (with target=${path.basename(target().name)})`, async () => {
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
                    expect(fs.existsSync(output)).toEqual(true);
                    expect(output.startsWith(path.resolve(dir, 'out', 'make'))).toEqual(true);
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
            // eslint-disable-next-line n/no-missing-require
            overrideTargets: [require.resolve('@electron-forge/maker-zip'), require.resolve('@electron-forge/maker-dmg')],
            platform: 'mas',
          })
        ).resolves.toHaveLength(2);
      });
    });
  });
});

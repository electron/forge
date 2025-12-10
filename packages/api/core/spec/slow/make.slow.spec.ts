import fs from 'node:fs';
import path from 'node:path';

import { createDefaultCertificate } from '@electron-forge/maker-appx';
import { IForgeResolvableMaker } from '@electron-forge/shared-types';
import {
  ensureTestDirIsNonexistent,
  updatePackageJSON,
} from '@electron-forge/test-utils';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api } from '../../src/api/index';

describe('Make', () => {
  const dir = path.resolve(__dirname, '..', 'fixture', 'default-app');
  let outDir: string;
  let makeDir: string;
  let devCert: string;

  beforeAll(async () => {
    outDir = await ensureTestDirIsNonexistent();
    makeDir = path.join(outDir, 'make');
    await api.package({ dir, outDir });

    if (process.platform === 'win32') {
      devCert = await createDefaultCertificate('CN=Test Author', {
        certFilePath: dir,
      });
    }

    return async () => {
      await fs.promises.rm(outDir, { recursive: true, force: true });
    };
  });

  afterEach(async () => {
    await fs.promises.rm(makeDir, { recursive: true, force: true });
  });

  it('makes from a custom outDir without errors', async () => {
    await api.make({ dir, skipPackage: true, outDir });

    // out/make/zip/darwin/arm64/default-app-darwin-arm64-1.0.0.zip
    const artifactPath = path.join(
      outDir,
      'make',
      'zip',
      process.platform,
      process.arch,
      `default-app-${process.platform}-${process.arch}-1.0.0.zip`,
    );

    expect(fs.existsSync(artifactPath)).toBe(true);

    // spot check that the zip archive is greater than 50MB
    const { size } = await fs.promises.stat(artifactPath);
    expect(size).toBeGreaterThan(50 * 1024 * 1024);
  });

  it('throws an error when given an unrecognized platform', async () => {
    await expect(api.make({ dir, platform: 'dos' })).rejects.toThrow(
      /invalid platform/,
    );
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
      }),
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
      }),
    ).rejects.toThrow(
      'Could not find any make targets configured for the "linux" platform.',
    );
  });

  it.runIf(process.platform === 'darwin')(
    'makes Mac App Store targets',
    async () => {
      await expect(
        api.make({
          dir,
          outDir,
          overrideTargets: [
            require.resolve('@electron-forge/maker-zip'),
            require.resolve('@electron-forge/maker-dmg'),
          ],
          platform: 'mas',
        }),
      ).resolves.toHaveLength(2);
    },
  );

  describe('with Makers', () => {
    if (process.platform !== 'win32') {
      process.env.DISABLE_SQUIRREL_TEST = 'true';
    }

    function getMakers(good: boolean) {
      const allMakers = [
        '@electron-forge/maker-appx',
        '@electron-forge/maker-deb',
        '@electron-forge/maker-dmg',
        '@electron-forge/maker-flatpak',
        '@electron-forge/maker-msix',
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
          return (
            maker.isSupportedOnCurrentPlatform() === good &&
            maker.externalBinariesExist() === good
          );
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
            (
              makerDefinition.config as Record<string, unknown>
            ).makeVersionWinStoreCompatible = true;
          }

          return makerDefinition;
        });
    }

    const goodMakers = getMakers(true);
    const badMakers = getMakers(false);

    const testMakeTarget = function (
      target: () => { name: string },
      shouldPass: boolean,
    ) {
      describe(`${path.basename(target().name)}`, async () => {
        beforeAll(async () => {
          const original = await updatePackageJSON(dir, async (packageJSON) => {
            return {
              ...packageJSON,
              config: {
                forge: {
                  packagerConfig: {
                    executableName: 'default-app',
                  },
                  makers: [target() as IForgeResolvableMaker],
                },
              },
            };
          });

          return async () => {
            await updatePackageJSON(dir, (_packageJSON) => {
              return original;
            });
          };
        });

        if (shouldPass) {
          it(`makes the correct artifact`, async () => {
            const outputs = await api.make({ dir, outDir, skipPackage: true });
            for (const outputResult of outputs) {
              for (const output of outputResult.artifacts) {
                expect(fs.existsSync(output)).toEqual(true);
                expect(output).toContain(path.resolve(outDir, 'make'));
              }
            }
          });
        } else {
          it(`fails`, async () => {
            await expect(
              api.make({ dir, outDir, skipPackage: true }),
            ).rejects.toThrow();
          });
        }
      });
    };

    for (const maker of goodMakers) {
      testMakeTarget(maker, true);
    }

    for (const maker of badMakers) {
      testMakeTarget(maker, false);
    }
  });
});

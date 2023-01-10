import path from 'path';

import { getElectronVersion } from '@electron-forge/core-utils';
import { MakerBase } from '@electron-forge/maker-base';
import { ForgeArch, ForgeConfigMaker, ForgeMakeResult, ForgePlatform, IForgeResolvableMaker, ResolvedForgeConfig } from '@electron-forge/shared-types';
import { getHostArch } from '@electron/get';
import chalk from 'chalk';
import filenamify from 'filenamify';
import fs from 'fs-extra';
import { Listr } from 'listr2';
import logSymbols from 'log-symbols';

import getForgeConfig from '../util/forge-config';
import { getHookListrTasks, runMutatingHook } from '../util/hook';
import getCurrentOutDir from '../util/out-dir';
import parseArchs from '../util/parse-archs';
import { readMutatedPackageJson } from '../util/read-package-json';
import requireSearch from '../util/require-search';
import resolveDir from '../util/resolve-dir';

import { listrPackage } from './package';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class MakerImpl extends MakerBase<any> {
  name = 'impl';

  defaultPlatforms = [];
}

type MakeTargets = ForgeConfigMaker[] | string[];

function generateTargets(forgeConfig: ResolvedForgeConfig, overrideTargets?: MakeTargets) {
  if (overrideTargets) {
    return overrideTargets.map((target) => {
      if (typeof target === 'string') {
        return forgeConfig.makers.find((maker) => (maker as IForgeResolvableMaker).name === target) || ({ name: target } as IForgeResolvableMaker);
      }

      return target;
    });
  }
  return forgeConfig.makers;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isElectronForgeMaker(target: MakerBase<any> | unknown): target is MakerBase<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target as MakerBase<any>).__isElectronForgeMaker;
}

type MakeContext = {
  dir: string;
  forgeConfig: ResolvedForgeConfig;
  actualOutDir: string;
  makers: MakerBase<unknown>[];
  outputs: ForgeMakeResult[];
};

export interface MakeOptions {
  /**
   * The path to the app from which distrubutables are generated
   */
  dir?: string;
  /**
   * Whether to use sensible defaults or prompt the user visually
   */
  interactive?: boolean;
  /**
   * Whether to skip the pre-make packaging step
   */
  skipPackage?: boolean;
  /**
   * An array of make targets to override your forge config
   */
  overrideTargets?: MakeTargets;
  /**
   * The target architecture
   */
  arch?: ForgeArch;
  /**
   * The target platform
   */
  platform?: ForgePlatform;
  /**
   * The path to the directory containing generated distributables
   */
  outDir?: string;
}

export const listrMake = (
  {
    dir: providedDir = process.cwd(),
    interactive = false,
    skipPackage = false,
    arch = getHostArch() as ForgeArch,
    platform = process.platform as ForgePlatform,
    overrideTargets,
    outDir,
  }: MakeOptions,
  receiveMakeResults?: (results: ForgeMakeResult[]) => void
) => {
  const listrOptions = {
    concurrent: false,
    rendererOptions: {
      collapse: false,
      collapseErrors: false,
    },
    rendererSilent: !interactive,
    rendererFallback: Boolean(process.env.DEBUG),
  };

  const runner = new Listr<MakeContext>(
    [
      {
        title: 'Loading configuration',
        task: async (ctx) => {
          const resolvedDir = await resolveDir(providedDir);
          if (!resolvedDir) {
            throw new Error('Failed to locate startable Electron application');
          }

          ctx.dir = resolvedDir;
          ctx.forgeConfig = await getForgeConfig(resolvedDir);
        },
      },
      {
        title: 'Resolving make targets',
        task: async (ctx, task) => {
          const { dir, forgeConfig } = ctx;
          ctx.actualOutDir = outDir || getCurrentOutDir(dir, forgeConfig);

          if (!['darwin', 'win32', 'linux', 'mas'].includes(platform)) {
            throw new Error(`'${platform}' is an invalid platform. Choices are 'darwin', 'mas', 'win32' or 'linux'.`);
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const makers: MakerBase<any>[] = [];

          const possibleMakers = generateTargets(forgeConfig, overrideTargets);

          for (const possibleMaker of possibleMakers) {
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            let maker: MakerBase<any>;
            if (isElectronForgeMaker(possibleMaker)) {
              maker = possibleMaker;
              if (!maker.platforms.includes(platform)) continue;
            } else {
              const resolvableTarget = possibleMaker as IForgeResolvableMaker;
              // non-false falsy values should be 'true'
              if (resolvableTarget.enabled === false) continue;

              if (!resolvableTarget.name) {
                throw new Error(`The following maker config is missing a maker name: ${JSON.stringify(resolvableTarget)}`);
              } else if (typeof resolvableTarget.name !== 'string') {
                throw new Error(`The following maker config has a maker name that is not a string: ${JSON.stringify(resolvableTarget)}`);
              }

              const MakerClass = requireSearch<typeof MakerImpl>(dir, [resolvableTarget.name]);
              if (!MakerClass) {
                throw new Error(
                  `Could not find module with name '${resolvableTarget.name}'. If this is a package from NPM, make sure it's listed in the devDependencies of your package.json. If this is a local module, make sure you have the correct path to its entry point. Try using the DEBUG="electron-forge:require-search" environment variable for more information.`
                );
              }

              maker = new MakerClass(resolvableTarget.config, resolvableTarget.platforms || undefined);
              if (!maker.platforms.includes(platform)) continue;
            }

            if (!maker.isSupportedOnCurrentPlatform) {
              throw new Error(
                [
                  `Maker for target ${maker.name} is incompatible with this version of `,
                  'Electron Forge, please upgrade or contact the maintainer ',
                  "(needs to implement 'isSupportedOnCurrentPlatform)')",
                ].join('')
              );
            }

            if (!maker.isSupportedOnCurrentPlatform()) {
              throw new Error(`Cannot make for ${platform} and target ${maker.name}: the maker declared that it cannot run on ${process.platform}.`);
            }

            maker.ensureExternalBinariesExist();

            makers.push(maker);
          }

          if (makers.length === 0) {
            throw new Error(`Could not find any make targets configured for the "${platform}" platform.`);
          }

          ctx.makers = makers;

          task.output = `Making for the following targets: ${chalk.magenta(`${makers.map((maker) => maker.name).join(', ')}`)}`;
        },
        options: {
          persistentOutput: true,
        },
      },
      {
        title: `Running ${chalk.yellow('package')} command`,
        task: async (ctx, task) => {
          if (!skipPackage) {
            return listrPackage({
              dir: ctx.dir,
              interactive,
              arch,
              outDir: ctx.actualOutDir,
              platform,
            });
          } else {
            task.output = chalk.yellow(`${logSymbols.warning} Skipping could result in an out of date build`);
            task.skip();
          }
        },
        options: {
          persistentOutput: true,
        },
      },
      {
        title: `Running ${chalk.yellow('preMake')} hook`,
        task: async (ctx, task) => {
          return task.newListr(await getHookListrTasks(ctx.forgeConfig, 'preMake'));
        },
      },
      {
        title: 'Making distributables',
        task: async (ctx, task) => {
          const { actualOutDir, dir, forgeConfig, makers } = ctx;
          const packageJSON = await readMutatedPackageJson(dir, forgeConfig);
          const appName = filenamify(forgeConfig.packagerConfig.name || packageJSON.productName || packageJSON.name, { replacement: '-' });
          const outputs: ForgeMakeResult[] = [];
          ctx.outputs = outputs;

          const subRunner = task.newListr([], {
            ...listrOptions,
            rendererOptions: {
              collapse: false,
              collapseErrors: false,
            },
          });

          for (const targetArch of parseArchs(platform, arch, await getElectronVersion(dir, packageJSON))) {
            const packageDir = path.resolve(actualOutDir, `${appName}-${platform}-${targetArch}`);
            if (!(await fs.pathExists(packageDir))) {
              throw new Error(`Couldn't find packaged app at: ${packageDir}`);
            }

            for (const maker of makers) {
              subRunner.add({
                title: `Making a ${chalk.magenta(maker.name)} distributable for ${chalk.cyan(`${platform}/${targetArch}`)}`,
                task: async () => {
                  try {
                    /**
                     * WARNING: DO NOT ATTEMPT TO PARALLELIZE MAKERS
                     *
                     * Currently it is assumed we have 1 maker per make call but that is
                     * not enforced.  It is technically possible to have 1 maker be called
                     * multiple times.  The "prepareConfig" method however implicitly
                     * requires a lock that is not enforced.  There are two options:
                     *
                     *   * Provide makers a getConfig() method
                     *   * Remove support for config being provided as a method
                     *   * Change the entire API of maker from a single constructor to
                     *     providing a MakerFactory
                     */
                    maker.prepareConfig(targetArch);
                    const artifacts = await maker.make({
                      appName,
                      forgeConfig,
                      packageJSON,
                      targetArch,
                      dir: packageDir,
                      makeDir: path.resolve(actualOutDir, 'make'),
                      targetPlatform: platform,
                    });

                    outputs.push({
                      artifacts,
                      packageJSON,
                      platform,
                      arch: targetArch,
                    });
                  } catch (err) {
                    if (err) {
                      throw err;
                    } else {
                      throw new Error(`An unknown error occurred while making for target: ${maker.name}`);
                    }
                  }
                },
                options: {
                  showTimer: true,
                },
              });
            }
          }

          return subRunner;
        },
      },
      {
        title: `Running ${chalk.yellow('postMake')} hook`,
        task: async (ctx, task) => {
          // If the postMake hooks modifies the locations / names of the outputs it must return
          // the new locations so that the publish step knows where to look
          ctx.outputs = await runMutatingHook(ctx.forgeConfig, 'postMake', ctx.outputs);
          receiveMakeResults?.(ctx.outputs);

          task.output = `Artifacts available at: ${chalk.green(path.resolve(ctx.actualOutDir, 'make'))}`;
        },
        options: {
          persistentOutput: true,
        },
      },
    ],
    {
      ...listrOptions,
      ctx: {} as MakeContext,
    }
  );

  return runner;
};

const make = async (opts: MakeOptions): Promise<ForgeMakeResult[]> => {
  const runner = listrMake(opts);

  await runner.run();

  return runner.ctx.outputs;
};

export default make;

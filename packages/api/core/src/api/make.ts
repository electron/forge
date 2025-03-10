import path from 'node:path';

import { getHostArch } from '@electron/get';
import { getElectronVersion } from '@electron-forge/core-utils';
import { MakerBase } from '@electron-forge/maker-base';
import {
  ForgeArch,
  ForgeConfigMaker,
  ForgeListrOptions,
  ForgeListrTaskFn,
  ForgeMakeResult,
  ForgePlatform,
  IForgeResolvableMaker,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import { autoTrace, delayTraceTillSignal } from '@electron-forge/tracer';
import chalk from 'chalk';
import filenamify from 'filenamify';
import fs from 'fs-extra';
import { Listr, PRESET_TIMER } from 'listr2';
import logSymbols from 'log-symbols';

import getForgeConfig from '../util/forge-config';
import { getHookListrTasks, runMutatingHook } from '../util/hook';
import importSearch from '../util/import-search';
import getCurrentOutDir from '../util/out-dir';
import parseArchs from '../util/parse-archs';
import { readMutatedPackageJson } from '../util/read-package-json';
import resolveDir from '../util/resolve-dir';

import { listrPackage } from './package';

type MakerImpl = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): MakerBase<any>;
};

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
  makers: Array<() => MakerBase<unknown>>;
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
  childTrace: typeof autoTrace,
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
  const listrOptions: ForgeListrOptions<MakeContext> = {
    concurrent: false,
    rendererOptions: {
      collapseSubtasks: false,
      collapseErrors: false,
    },
    silentRendererCondition: !interactive,
    fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
  };

  const runner = new Listr<MakeContext>(
    [
      {
        title: 'Loading configuration',
        task: childTrace<Parameters<ForgeListrTaskFn<MakeContext>>>({ name: 'load-forge-config', category: '@electron-forge/core' }, async (_, ctx) => {
          const resolvedDir = await resolveDir(providedDir);
          if (!resolvedDir) {
            throw new Error('Failed to locate startable Electron application');
          }

          ctx.dir = resolvedDir;
          ctx.forgeConfig = await getForgeConfig(resolvedDir);
        }),
      },
      {
        title: 'Resolving make targets',
        task: childTrace<Parameters<ForgeListrTaskFn<MakeContext>>>(
          { name: 'resolve-make-targets', category: '@electron-forge/core' },
          async (_, ctx, task) => {
            const { dir, forgeConfig } = ctx;
            ctx.actualOutDir = outDir || getCurrentOutDir(dir, forgeConfig);

            if (!['darwin', 'win32', 'linux', 'mas'].includes(platform)) {
              throw new Error(`'${platform}' is an invalid platform. Choices are 'darwin', 'mas', 'win32' or 'linux'.`);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const makers: Array<() => MakerBase<any>> = [];

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

                const MakerClass = await importSearch<MakerImpl>(dir, [resolvableTarget.name]);
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

              makers.push(() => maker.clone());
            }

            if (makers.length === 0) {
              throw new Error(`Could not find any make targets configured for the "${platform}" platform.`);
            }

            ctx.makers = makers;

            task.output = `Making for the following targets: ${chalk.magenta(`${makers.map((maker) => maker.name).join(', ')}`)}`;
          }
        ),
        rendererOptions: {
          persistentOutput: true,
        },
      },
      {
        title: `Running ${chalk.yellow('package')} command`,
        task: childTrace<Parameters<ForgeListrTaskFn<MakeContext>>>({ name: 'package()', category: '@electron-forge/core' }, async (childTrace, ctx, task) => {
          if (!skipPackage) {
            return delayTraceTillSignal(
              childTrace,
              listrPackage(childTrace, {
                dir: ctx.dir,
                interactive,
                arch,
                outDir: ctx.actualOutDir,
                platform,
              }),
              'run'
            );
          } else {
            task.output = chalk.yellow(`${logSymbols.warning} Skipping could result in an out of date build`);
            task.skip();
          }
        }),
        rendererOptions: {
          persistentOutput: true,
        },
      },
      {
        title: `Running ${chalk.yellow('preMake')} hook`,
        task: childTrace<Parameters<ForgeListrTaskFn<MakeContext>>>(
          { name: 'run-preMake-hook', category: '@electron-forge/core' },
          async (childTrace, ctx, task) => {
            return delayTraceTillSignal(childTrace, task.newListr(await getHookListrTasks(childTrace, ctx.forgeConfig, 'preMake')), 'run');
          }
        ),
      },
      {
        title: 'Making distributables',
        task: childTrace<Parameters<ForgeListrTaskFn<MakeContext>>>(
          { name: 'make-distributables', category: '@electron-forge/core' },
          async (childTrace, ctx, task) => {
            const { actualOutDir, dir, forgeConfig, makers } = ctx;
            const packageJSON = await readMutatedPackageJson(dir, forgeConfig);
            const appName = filenamify(forgeConfig.packagerConfig.name || packageJSON.productName || packageJSON.name, { replacement: '-' });
            const outputs: ForgeMakeResult[] = [];
            ctx.outputs = outputs;

            const subRunner = task.newListr([], {
              ...listrOptions,
              concurrent: true,
              rendererOptions: {
                collapseSubtasks: false,
                collapseErrors: false,
              },
            });

            for (const targetArch of parseArchs(platform, arch, await getElectronVersion(dir, packageJSON))) {
              const packageDir = path.resolve(actualOutDir, `${appName}-${platform}-${targetArch}`);
              if (!(await fs.pathExists(packageDir))) {
                throw new Error(`Couldn't find packaged app at: ${packageDir}`);
              }

              for (const maker of makers) {
                const uniqMaker = maker();
                subRunner.add({
                  title: `Making a ${chalk.magenta(uniqMaker.name)} distributable for ${chalk.cyan(`${platform}/${targetArch}`)}`,
                  task: childTrace<[]>({ name: `make-${maker.name}`, category: '@electron-forge/core', newRoot: true }, async () => {
                    try {
                      await Promise.resolve(uniqMaker.prepareConfig(targetArch));
                      const artifacts = await uniqMaker.make({
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
                      if (err instanceof Error) {
                        throw err;
                      } else if (typeof err === 'string') {
                        throw new Error(err);
                      } else {
                        throw new Error(`An unknown error occurred while making for target: ${uniqMaker.name}`);
                      }
                    }
                  }),
                  rendererOptions: {
                    timer: { ...PRESET_TIMER },
                  },
                });
              }
            }

            return delayTraceTillSignal(childTrace, subRunner, 'run');
          }
        ),
      },
      {
        title: `Running ${chalk.yellow('postMake')} hook`,
        task: childTrace<Parameters<ForgeListrTaskFn<MakeContext>>>({ name: 'run-postMake-hook', category: '@electron-forge/core' }, async (_, ctx, task) => {
          // If the postMake hooks modifies the locations / names of the outputs it must return
          // the new locations so that the publish step knows where to look
          const originalOutputs = JSON.stringify(ctx.outputs);
          ctx.outputs = await runMutatingHook(ctx.forgeConfig, 'postMake', ctx.outputs);

          let outputLocations = [path.resolve(ctx.actualOutDir, 'make')];
          if (originalOutputs !== JSON.stringify(ctx.outputs)) {
            const newDirs = new Set<string>();
            const artifactPaths = [];
            for (const result of ctx.outputs) {
              for (const artifact of result.artifacts) {
                newDirs.add(path.dirname(artifact));
                artifactPaths.push(artifact);
              }
            }
            if (newDirs.size <= ctx.outputs.length) {
              outputLocations = [...newDirs];
            } else {
              outputLocations = artifactPaths;
            }
          }
          receiveMakeResults?.(ctx.outputs);

          task.output = `Artifacts available at: ${chalk.green(outputLocations.join(', '))}`;
        }),
        rendererOptions: {
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

export default autoTrace({ name: 'make()', category: '@electron-forge/core' }, async (childTrace, opts: MakeOptions): Promise<ForgeMakeResult[]> => {
  const runner = listrMake(childTrace, opts);

  await runner.run();

  return runner.ctx.outputs;
});

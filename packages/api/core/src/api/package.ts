import path from 'node:path';
import { promisify } from 'node:util';

import { getHostArch } from '@electron/get';
import { FinalizePackageTargetsHookFunction, HookFunction, Options, packager, TargetDefinition } from '@electron/packager';
import { getElectronVersion, listrCompatibleRebuildHook } from '@electron-forge/core-utils';
import { ForgeArch, ForgeListrTask, ForgeListrTaskDefinition, ForgeListrTaskFn, ForgePlatform, ResolvedForgeConfig } from '@electron-forge/shared-types';
import { autoTrace, delayTraceTillSignal } from '@electron-forge/tracer';
import chalk from 'chalk';
import debug from 'debug';
import glob from 'fast-glob';
import fs from 'fs-extra';
import { Listr, PRESET_TIMER } from 'listr2';

import getForgeConfig from '../util/forge-config';
import { getHookListrTasks, runHook } from '../util/hook';
import importSearch from '../util/import-search';
import { warn } from '../util/messages';
import getCurrentOutDir from '../util/out-dir';
import { readMutatedPackageJson } from '../util/read-package-json';
import resolveDir from '../util/resolve-dir';

const d = debug('electron-forge:packager');

/**
 * Resolves hooks if they are a path to a file (instead of a `Function`).
 */
async function resolveHooks<F = HookFunction>(hooks: (string | F)[] | undefined, dir: string) {
  if (hooks) {
    return await Promise.all(hooks.map(async (hook) => (typeof hook === 'string' ? ((await importSearch<F>(dir, [hook])) as F) : hook)));
  }

  return [];
}

type DoneFunction = (err?: Error) => void;
type PromisifiedHookFunction = (buildPath: string, electronVersion: string, platform: string, arch: string) => Promise<void>;
type PromisifiedFinalizePackageTargetsHookFunction = (targets: TargetDefinition[]) => Promise<void>;

/**
 * @deprecated Only use until \@electron/packager publishes a new major version with promise based hooks
 */
function hidePromiseFromPromisify<P extends unknown[]>(fn: (...args: P) => Promise<void>): (...args: P) => void {
  return (...args: P) => {
    void fn(...args);
  };
}

/**
 * Runs given hooks sequentially by mapping them to promises and iterating
 * through while awaiting
 */
function sequentialHooks(hooks: HookFunction[]): PromisifiedHookFunction[] {
  return [
    hidePromiseFromPromisify(async (buildPath: string, electronVersion: string, platform: string, arch: string, done: DoneFunction) => {
      for (const hook of hooks) {
        try {
          await promisify(hook)(buildPath, electronVersion, platform, arch);
        } catch (err) {
          d('hook failed:', hook.toString(), err);
          return done(err as Error);
        }
      }
      done();
    }),
  ] as PromisifiedHookFunction[];
}
function sequentialFinalizePackageTargetsHooks(hooks: FinalizePackageTargetsHookFunction[]): PromisifiedFinalizePackageTargetsHookFunction[] {
  return [
    hidePromiseFromPromisify(async (targets: TargetDefinition[], done: DoneFunction) => {
      for (const hook of hooks) {
        try {
          await promisify(hook)(targets);
        } catch (err) {
          return done(err as Error);
        }
      }
      done();
    }),
  ] as PromisifiedFinalizePackageTargetsHookFunction[];
}

type PackageContext = {
  dir: string;
  forgeConfig: ResolvedForgeConfig;
  packageJSON: any;
  calculatedOutDir: string;
  packagerPromise: Promise<string[]>;
  targets: InternalTargetDefinition[];
};

type InternalTargetDefinition = TargetDefinition & {
  forUniversal?: boolean;
};

type PackageResult = TargetDefinition & {
  packagedPath: string;
};

export interface PackageOptions {
  /**
   * The path to the app to package
   */
  dir?: string;
  /**
   * Whether to use sensible defaults or prompt the user visually
   */
  interactive?: boolean;
  /**
   * The target arch
   */
  arch?: ForgeArch;
  /**
   * The target platform.
   */
  platform?: ForgePlatform;
  /**
   * The path to the output directory for packaged apps
   */
  outDir?: string;
}

export const listrPackage = (
  childTrace: typeof autoTrace,
  {
    dir: providedDir = process.cwd(),
    interactive = false,
    arch = getHostArch() as ForgeArch,
    platform = process.platform as ForgePlatform,
    outDir,
  }: PackageOptions
) => {
  const runner = new Listr<PackageContext>(
    [
      {
        title: 'Preparing to package application',
        task: childTrace<Parameters<ForgeListrTaskFn<PackageContext>>>({ name: 'package-prepare', category: '@electron-forge/core' }, async (_, ctx) => {
          const resolvedDir = await resolveDir(providedDir);
          if (!resolvedDir) {
            throw new Error('Failed to locate compilable Electron application');
          }
          ctx.dir = resolvedDir;

          ctx.forgeConfig = await getForgeConfig(resolvedDir);
          ctx.packageJSON = await readMutatedPackageJson(resolvedDir, ctx.forgeConfig);

          if (!ctx.packageJSON.main) {
            throw new Error('packageJSON.main must be set to a valid entry point for your Electron app');
          }

          ctx.calculatedOutDir = outDir || getCurrentOutDir(resolvedDir, ctx.forgeConfig);
        }),
      },
      {
        title: 'Running packaging hooks',
        task: childTrace<Parameters<ForgeListrTaskFn<PackageContext>>>(
          { name: 'run-packaging-hooks', category: '@electron-forge/core' },
          async (childTrace, { forgeConfig }, task) => {
            return delayTraceTillSignal(
              childTrace,
              task.newListr([
                {
                  title: `Running ${chalk.yellow('generateAssets')} hook`,
                  task: childTrace<Parameters<ForgeListrTaskFn>>(
                    { name: 'run-generateAssets-hook', category: '@electron-forge/core' },
                    async (childTrace, _, task) => {
                      return delayTraceTillSignal(
                        childTrace,
                        task.newListr(await getHookListrTasks(childTrace, forgeConfig, 'generateAssets', platform, arch)),
                        'run'
                      );
                    }
                  ),
                },
                {
                  title: `Running ${chalk.yellow('prePackage')} hook`,
                  task: childTrace<Parameters<ForgeListrTaskFn>>(
                    { name: 'run-prePackage-hook', category: '@electron-forge/core' },
                    async (childTrace, _, task) => {
                      return delayTraceTillSignal(
                        childTrace,
                        task.newListr(await getHookListrTasks(childTrace, forgeConfig, 'prePackage', platform, arch)),
                        'run'
                      );
                    }
                  ),
                },
              ]),
              'run'
            );
          }
        ),
      },
      {
        title: 'Packaging application',
        task: childTrace<Parameters<ForgeListrTaskFn<PackageContext>>>(
          { name: 'packaging-application', category: '@electron-forge/core' },
          async (childTrace, ctx, task) => {
            const { calculatedOutDir, forgeConfig, packageJSON } = ctx;
            const getTargetKey = (target: TargetDefinition) => `${target.platform}/${target.arch}`;

            task.output = 'Determining targets...';

            type StepDoneSignalMap = Map<string, (() => void)[]>;
            const signalCopyDone: StepDoneSignalMap = new Map();
            const signalRebuildDone: StepDoneSignalMap = new Map();
            const signalPackageDone: StepDoneSignalMap = new Map();
            const rejects: ((err: any) => void)[] = [];
            const signalDone = (map: StepDoneSignalMap, target: TargetDefinition) => {
              map.get(getTargetKey(target))?.pop()?.();
            };
            const addSignalAndWait = async (map: StepDoneSignalMap, target: TargetDefinition) => {
              const targetKey = getTargetKey(target);
              await new Promise<void>((resolve, reject) => {
                rejects.push(reject);
                map.set(targetKey, (map.get(targetKey) || []).concat([resolve]));
              });
            };

            let provideTargets: (targets: TargetDefinition[]) => void;
            const targetsPromise = new Promise<InternalTargetDefinition[]>((resolve, reject) => {
              provideTargets = resolve;
              rejects.push(reject);
            });

            const rebuildTasks = new Map<string, Promise<ForgeListrTask<never>>[]>();
            const signalRebuildStart = new Map<string, ((task: ForgeListrTask<never>) => void)[]>();
            const afterFinalizePackageTargetsHooks: FinalizePackageTargetsHookFunction[] = [
              (targets, done) => {
                provideTargets(targets);
                done();
              },
              ...(await resolveHooks(forgeConfig.packagerConfig.afterFinalizePackageTargets, ctx.dir)),
            ];

            const pruneEnabled = !('prune' in forgeConfig.packagerConfig) || forgeConfig.packagerConfig.prune;

            const afterCopyHooks: HookFunction[] = [
              hidePromiseFromPromisify(async (buildPath, electronVersion, platform, arch, done) => {
                signalDone(signalCopyDone, { platform, arch });
                done();
              }),
              hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                const bins = await glob(path.join(buildPath, '**/.bin/**/*'));
                for (const bin of bins) {
                  await fs.remove(bin);
                }
                done();
              }),
              hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                await runHook(forgeConfig, 'packageAfterCopy', buildPath, electronVersion, pPlatform, pArch);
                done();
              }),
              hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                const targetKey = getTargetKey({ platform: pPlatform, arch: pArch });
                await listrCompatibleRebuildHook(
                  buildPath,
                  electronVersion,
                  pPlatform,
                  pArch,
                  forgeConfig.rebuildConfig,
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  await rebuildTasks.get(targetKey)!.pop()!
                );
                signalRebuildDone.get(targetKey)?.pop()?.();
                done();
              }),
              hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                const copiedPackageJSON = await readMutatedPackageJson(buildPath, forgeConfig);
                if (copiedPackageJSON.config && copiedPackageJSON.config.forge) {
                  delete copiedPackageJSON.config.forge;
                }
                await fs.writeJson(path.resolve(buildPath, 'package.json'), copiedPackageJSON, { spaces: 2 });
                done();
              }),
              ...(await resolveHooks(forgeConfig.packagerConfig.afterCopy, ctx.dir)),
            ];

            const afterCompleteHooks: HookFunction[] = [
              hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                signalPackageDone.get(getTargetKey({ platform: pPlatform, arch: pArch }))?.pop()?.();
                done();
              }),
              ...(await resolveHooks(forgeConfig.packagerConfig.afterComplete, ctx.dir)),
            ];

            const afterPruneHooks = [];

            if (pruneEnabled) {
              afterPruneHooks.push(...(await resolveHooks(forgeConfig.packagerConfig.afterPrune, ctx.dir)));
            }

            afterPruneHooks.push(
              hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                await runHook(forgeConfig, 'packageAfterPrune', buildPath, electronVersion, pPlatform, pArch);
                done();
              }) as HookFunction
            );

            const afterExtractHooks = [
              hidePromiseFromPromisify(async (buildPath, electronVersion, pPlatform, pArch, done) => {
                await runHook(forgeConfig, 'packageAfterExtract', buildPath, electronVersion, pPlatform, pArch);
                done();
              }) as HookFunction,
            ];
            afterExtractHooks.push(...(await resolveHooks(forgeConfig.packagerConfig.afterExtract, ctx.dir)));

            type PackagerArch = Exclude<ForgeArch, 'arm'>;

            const packageOpts: Options = {
              asar: false,
              overwrite: true,
              ignore: [/^\/out\//g],
              quiet: true,
              ...forgeConfig.packagerConfig,
              dir: ctx.dir,
              arch: arch as PackagerArch,
              platform,
              afterFinalizePackageTargets: sequentialFinalizePackageTargetsHooks(afterFinalizePackageTargetsHooks),
              afterComplete: sequentialHooks(afterCompleteHooks),
              afterCopy: sequentialHooks(afterCopyHooks),
              afterExtract: sequentialHooks(afterExtractHooks),
              afterPrune: sequentialHooks(afterPruneHooks),
              out: calculatedOutDir,
              electronVersion: await getElectronVersion(ctx.dir, packageJSON),
            };

            if (packageOpts.all) {
              throw new Error('config.forge.packagerConfig.all is not supported by Electron Forge');
            }

            if (!packageJSON.version && !packageOpts.appVersion) {
              warn(
                interactive,
                chalk.yellow(
                  'Please set "version" or "config.forge.packagerConfig.appVersion" in your application\'s package.json so auto-updates work properly'
                )
              );
            }

            if (packageOpts.prebuiltAsar) {
              throw new Error('config.forge.packagerConfig.prebuiltAsar is not supported by Electron Forge');
            }

            d('packaging with options', packageOpts);

            ctx.packagerPromise = packager(packageOpts);
            // Handle error by failing this task
            // rejects is populated by the reject handlers for every
            // signal based promise in every subtask
            ctx.packagerPromise.catch((err) => {
              for (const reject of rejects) {
                reject(err);
              }
            });

            const targets = await targetsPromise;
            // Copy the resolved targets into the context for later
            ctx.targets = [...targets];
            // If we are targetting a universal build we need to add the "fake"
            // x64 and arm64 builds into the list of targets so that we can
            // show progress for those
            for (const target of targets) {
              if (target.arch === 'universal') {
                targets.push(
                  {
                    platform: target.platform,
                    arch: 'x64',
                    forUniversal: true,
                  },
                  {
                    platform: target.platform,
                    arch: 'arm64',
                    forUniversal: true,
                  }
                );
              }
            }

            // Populate rebuildTasks with promises that resolve with the rebuild tasks
            // that will eventually run
            for (const target of targets) {
              // Skip universal tasks as they do not have rebuild sub-tasks
              if (target.arch === 'universal') continue;

              const targetKey = getTargetKey(target);
              rebuildTasks.set(
                targetKey,
                (rebuildTasks.get(targetKey) || []).concat([
                  new Promise((resolve) => {
                    signalRebuildStart.set(targetKey, (signalRebuildStart.get(targetKey) || []).concat([resolve]));
                  }),
                ])
              );
            }
            d('targets:', targets);

            return delayTraceTillSignal(
              childTrace,
              task.newListr(
                targets.map(
                  (target): ForgeListrTaskDefinition =>
                    target.arch === 'universal'
                      ? {
                          title: `Stitching ${chalk.cyan(`${target.platform}/x64`)} and ${chalk.cyan(`${target.platform}/arm64`)} into a ${chalk.green(
                            `${target.platform}/universal`
                          )} package`,
                          task: async () => {
                            await addSignalAndWait(signalPackageDone, target);
                          },
                          rendererOptions: {
                            timer: { ...PRESET_TIMER },
                          },
                        }
                      : {
                          title: `Packaging for ${chalk.cyan(target.arch)} on ${chalk.cyan(target.platform)}${
                            target.forUniversal ? chalk.italic(' (for universal package)') : ''
                          }`,
                          task: childTrace<Parameters<ForgeListrTaskFn<never>>>(
                            {
                              name: `package-app-${target.platform}-${target.arch}${target.forUniversal ? '-universal-tmp' : ''}`,
                              category: '@electron-forge/core',
                              extraDetails: { arch: target.arch, platform: target.platform },
                              newRoot: true,
                            },
                            async (childTrace, _, task) => {
                              return delayTraceTillSignal(
                                childTrace,
                                task.newListr(
                                  [
                                    {
                                      title: 'Copying files',
                                      task: childTrace({ name: 'copy-files', category: '@electron-forge/core' }, async () => {
                                        await addSignalAndWait(signalCopyDone, target);
                                      }),
                                    },
                                    {
                                      title: 'Preparing native dependencies',
                                      task: childTrace({ name: 'prepare-native-dependencies', category: '@electron-forge/core' }, async (_, __, task) => {
                                        signalRebuildStart.get(getTargetKey(target))?.pop()?.(task);
                                        await addSignalAndWait(signalRebuildDone, target);
                                      }),
                                      rendererOptions: {
                                        persistentOutput: true,
                                        bottomBar: Infinity,
                                        timer: { ...PRESET_TIMER },
                                      },
                                    },
                                    {
                                      title: 'Finalizing package',
                                      task: childTrace({ name: 'finalize-package', category: '@electron-forge/core' }, async () => {
                                        await addSignalAndWait(signalPackageDone, target);
                                      }),
                                    },
                                  ],
                                  { rendererOptions: { collapseSubtasks: true, collapseErrors: false } }
                                ),
                                'run'
                              );
                            }
                          ),
                          rendererOptions: {
                            timer: { ...PRESET_TIMER },
                          },
                        }
                ),
                { concurrent: true, rendererOptions: { collapseSubtasks: false, collapseErrors: false } }
              ),
              'run'
            );
          }
        ),
      },
      {
        title: `Running ${chalk.yellow('postPackage')} hook`,
        task: childTrace<Parameters<ForgeListrTaskFn<PackageContext>>>(
          { name: 'run-postPackage-hook', category: '@electron-forge/core' },
          async (childTrace, { packagerPromise, forgeConfig }, task) => {
            const outputPaths = await packagerPromise;
            d('outputPaths:', outputPaths);
            return delayTraceTillSignal(
              childTrace,
              task.newListr(
                await getHookListrTasks(childTrace, forgeConfig, 'postPackage', {
                  arch,
                  outputPaths,
                  platform,
                })
              ),
              'run'
            );
          }
        ),
      },
    ],
    {
      concurrent: false,
      silentRendererCondition: !interactive,
      fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
      rendererOptions: {
        collapseSubtasks: false,
        collapseErrors: false,
      },
      ctx: {} as PackageContext,
    }
  );

  return runner;
};

export default autoTrace({ name: 'package()', category: '@electron-forge/core' }, async (childTrace, opts: PackageOptions): Promise<PackageResult[]> => {
  const runner = listrPackage(childTrace, opts);

  await runner.run();

  const outputPaths = await runner.ctx.packagerPromise;
  return runner.ctx.targets.map((target, index) => ({
    platform: target.platform,
    arch: target.arch,
    packagedPath: outputPaths[index],
  }));
});

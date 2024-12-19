import path from 'node:path';

import { PublisherBase } from '@electron-forge/publisher-base';
import {
  ForgeConfigPublisher,
  ForgeListrOptions,
  ForgeListrTask,
  ForgeListrTaskFn,
  ForgeMakeResult,
  IForgePublisher,
  IForgeResolvablePublisher,
  ResolvedForgeConfig,
  // ForgePlatform,
} from '@electron-forge/shared-types';
import { autoTrace, delayTraceTillSignal } from '@electron-forge/tracer';
import chalk from 'chalk';
import debug from 'debug';
import fs from 'fs-extra';
import { Listr } from 'listr2';

import getForgeConfig from '../util/forge-config';
import importSearch from '../util/import-search';
import getCurrentOutDir from '../util/out-dir';
import PublishState from '../util/publish-state';
import resolveDir from '../util/resolve-dir';

import { listrMake, MakeOptions } from './make';

const d = debug('electron-forge:publish');

type PublishContext = {
  dir: string;
  forgeConfig: ResolvedForgeConfig;
  publishers: PublisherBase<unknown>[];
  makeResults: ForgeMakeResult[];
};

export interface PublishOptions {
  /**
   * The path to the app to be published
   */
  dir?: string;
  /**
   * Whether to use sensible defaults or prompt the user visually
   */
  interactive?: boolean;
  /**
   * The publish targets, by default pulled from forge config, set this prop to
   * override that list
   */
  publishTargets?: ForgeConfigPublisher[] | string[];
  /**
   * Options object to passed through to make()
   */
  makeOptions?: MakeOptions;
  /**
   * The path to the directory containing generated distributables
   */
  outDir?: string;
  /**
   * Whether to generate dry run meta data but not actually publish
   */
  dryRun?: boolean;
  /**
   * Whether or not to attempt to resume a previously saved `dryRun` and publish
   *
   * You can't use this combination at the same time as dryRun=true
   */
  dryRunResume?: boolean;
}

export default autoTrace(
  { name: 'publish()', category: '@electron-forge/core' },
  async (
    childTrace,
    {
      dir: providedDir = process.cwd(),
      interactive = false,
      makeOptions = {},
      publishTargets = undefined,
      dryRun = false,
      dryRunResume = false,
      outDir,
    }: PublishOptions
  ): Promise<void> => {
    if (dryRun && dryRunResume) {
      throw new Error("Can't dry run and resume a dry run at the same time");
    }

    const listrOptions: ForgeListrOptions<PublishContext> = {
      concurrent: false,
      rendererOptions: {
        collapseErrors: false,
      },
      silentRendererCondition: !interactive,
      fallbackRendererCondition: Boolean(process.env.DEBUG) || Boolean(process.env.CI),
    };

    const publishDistributablesTasks = (childTrace: typeof autoTrace) => [
      {
        title: 'Publishing distributables',
        task: childTrace<Parameters<ForgeListrTaskFn<PublishContext>>>(
          { name: 'publish-distributables', category: '@electron-forge/core' },
          async (childTrace, { dir, forgeConfig, makeResults, publishers }, task: ForgeListrTask<PublishContext>) => {
            if (publishers.length === 0) {
              task.output = 'No publishers configured';
              task.skip();
              return;
            }

            return delayTraceTillSignal(
              childTrace,
              task.newListr<never>(
                publishers.map((publisher) => ({
                  title: `${chalk.cyan(`[publisher-${publisher.name}]`)} Running the ${chalk.yellow('publish')} command`,
                  task: childTrace<Parameters<ForgeListrTaskFn>>(
                    { name: `publish-${publisher.name}`, category: '@electron-forge/core' },
                    async (childTrace, _, task) => {
                      const setStatusLine = (s: string) => {
                        task.output = s;
                      };
                      await publisher.publish({
                        dir,
                        makeResults: makeResults!,
                        forgeConfig,
                        setStatusLine,
                      });
                    }
                  ),
                  rendererOptions: {
                    persistentOutput: true,
                  },
                })),
                {
                  rendererOptions: {
                    collapseSubtasks: false,
                    collapseErrors: false,
                  },
                }
              ),
              'run'
            );
          }
        ),
        rendererOptions: {
          persistentOutput: true,
        },
      },
    ];

    const runner = new Listr<PublishContext>(
      [
        {
          title: 'Loading configuration',
          task: childTrace<Parameters<ForgeListrTaskFn<PublishContext>>>(
            { name: 'load-forge-config', category: '@electron-forge/core' },
            async (childTrace, ctx) => {
              const resolvedDir = await resolveDir(providedDir);
              if (!resolvedDir) {
                throw new Error('Failed to locate publishable Electron application');
              }

              ctx.dir = resolvedDir;
              ctx.forgeConfig = await getForgeConfig(resolvedDir);
            }
          ),
        },
        {
          title: 'Resolving publish targets',
          task: childTrace<Parameters<ForgeListrTaskFn<PublishContext>>>(
            { name: 'resolve-publish-targets', category: '@electron-forge/core' },
            async (childTrace, ctx, task) => {
              const { dir, forgeConfig } = ctx;

              if (!publishTargets) {
                publishTargets = forgeConfig.publishers || [];
              }
              publishTargets = (publishTargets as ForgeConfigPublisher[]).map((target) => {
                if (typeof target === 'string') {
                  return (
                    (forgeConfig.publishers || []).find((p: ForgeConfigPublisher) => {
                      if (typeof p === 'string') return false;
                      if ((p as IForgePublisher).__isElectronForgePublisher) return false;
                      return (p as IForgeResolvablePublisher).name === target;
                    }) || { name: target }
                  );
                }
                return target;
              });

              ctx.publishers = [];
              for (const publishTarget of publishTargets) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let publisher: PublisherBase<any>;
                if ((publishTarget as IForgePublisher).__isElectronForgePublisher) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  publisher = publishTarget as PublisherBase<any>;
                } else {
                  const resolvablePublishTarget = publishTarget as IForgeResolvablePublisher;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const PublisherClass: any = await importSearch(dir, [resolvablePublishTarget.name]);
                  if (!PublisherClass) {
                    throw new Error(
                      `Could not find a publish target with the name: ${resolvablePublishTarget.name}. Make sure it's listed in the devDependencies of your package.json`
                    );
                  }

                  publisher = new PublisherClass(resolvablePublishTarget.config || {}, resolvablePublishTarget.platforms);
                }

                ctx.publishers.push(publisher);
              }

              if (ctx.publishers.length) {
                task.output = `Publishing to the following targets: ${chalk.magenta(`${ctx.publishers.map((publisher) => publisher.name).join(', ')}`)}`;
              }
            }
          ),
          rendererOptions: {
            persistentOutput: true,
          },
        },
        {
          title: dryRunResume ? 'Resuming from dry run...' : `Running ${chalk.yellow('make')} command`,
          task: childTrace<Parameters<ForgeListrTaskFn<PublishContext>>>(
            { name: dryRunResume ? 'resume-dry-run' : 'make()', category: '@electron-forge/core' },
            async (childTrace, ctx, task) => {
              const { dir, forgeConfig } = ctx;
              const calculatedOutDir = outDir || getCurrentOutDir(dir, forgeConfig);
              const dryRunDir = path.resolve(calculatedOutDir, 'publish-dry-run');

              if (dryRunResume) {
                d('attempting to resume from dry run');
                const publishes = await PublishState.loadFromDirectory(dryRunDir, dir);
                task.title = `Resuming ${publishes.length} found dry runs...`;

                return delayTraceTillSignal(
                  childTrace,
                  task.newListr<PublishContext>(
                    publishes.map((publishStates, index) => {
                      return {
                        title: `Publishing dry-run ${chalk.blue(`#${index + 1}`)}`,
                        task: childTrace<Parameters<ForgeListrTaskFn<PublishContext>>>(
                          { name: `publish-dry-run-${index + 1}`, category: '@electron-forge/core' },
                          async (childTrace, ctx, task) => {
                            const restoredMakeResults = publishStates.map(({ state }) => state);
                            d('restoring publish settings from dry run');

                            for (const makeResult of restoredMakeResults) {
                              makeResult.artifacts = await Promise.all(
                                makeResult.artifacts.map(async (makePath: string) => {
                                  // standardize the path to artifacts across platforms
                                  const normalizedPath = makePath.split(/\/|\\/).join(path.sep);
                                  if (!(await fs.pathExists(normalizedPath))) {
                                    throw new Error(`Attempted to resume a dry run, but an artifact (${normalizedPath}) could not be found`);
                                  }
                                  return normalizedPath;
                                })
                              );
                            }

                            d('publishing for given state set');
                            return delayTraceTillSignal(
                              childTrace,
                              task.newListr(publishDistributablesTasks(childTrace), {
                                ctx: {
                                  ...ctx,
                                  makeResults: restoredMakeResults,
                                },
                                rendererOptions: {
                                  collapseSubtasks: false,
                                  collapseErrors: false,
                                },
                              }),
                              'run'
                            );
                          }
                        ),
                      };
                    }),
                    {
                      rendererOptions: {
                        collapseSubtasks: false,
                        collapseErrors: false,
                      },
                    }
                  ),
                  'run'
                );
              }

              d('triggering make');
              return delayTraceTillSignal(
                childTrace,
                listrMake(
                  childTrace,
                  {
                    dir,
                    interactive,
                    ...makeOptions,
                  },
                  (results) => {
                    ctx.makeResults = results;
                  }
                ),
                'run'
              );
            }
          ),
        },
        ...(dryRunResume
          ? []
          : dryRun
          ? [
              {
                title: 'Saving dry-run state',
                task: childTrace<Parameters<ForgeListrTaskFn<PublishContext>>>(
                  { name: 'save-dry-run', category: '@electron-forge/core' },
                  async (childTrace, { dir, forgeConfig, makeResults }) => {
                    d('saving results of make in dry run state', makeResults);
                    const calculatedOutDir = outDir || getCurrentOutDir(dir, forgeConfig);
                    const dryRunDir = path.resolve(calculatedOutDir, 'publish-dry-run');

                    await fs.remove(dryRunDir);
                    await PublishState.saveToDirectory(dryRunDir, makeResults!, dir);
                  }
                ),
              },
            ]
          : publishDistributablesTasks(childTrace)),
      ],
      listrOptions
    );

    await runner.run();
  }
);

import path from 'path';

import { PublisherBase } from '@electron-forge/publisher-base';
import {
  ForgeConfigPublisher,
  ForgeListrTask,
  ForgeMakeResult,
  IForgePublisher,
  IForgeResolvablePublisher,
  ResolvedForgeConfig,
  // ForgePlatform,
} from '@electron-forge/shared-types';
import chalk from 'chalk';
import debug from 'debug';
import fs from 'fs-extra';
import { Listr } from 'listr2';

import getForgeConfig from '../util/forge-config';
import getCurrentOutDir from '../util/out-dir';
import PublishState from '../util/publish-state';
import requireSearch from '../util/require-search';
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

const publish = async ({
  dir: providedDir = process.cwd(),
  interactive = false,
  makeOptions = {},
  publishTargets = undefined,
  dryRun = false,
  dryRunResume = false,
  outDir,
}: PublishOptions): Promise<void> => {
  if (dryRun && dryRunResume) {
    throw new Error("Can't dry run and resume a dry run at the same time");
  }

  const listrOptions = {
    concurrent: false,
    rendererOptions: {
      collapseErrors: false,
    },
    rendererSilent: !interactive,
    rendererFallback: Boolean(process.env.DEBUG),
  };

  const publishDistributablesTasks = [
    {
      title: 'Publishing distributables',
      task: async ({ dir, forgeConfig, makeResults, publishers }: PublishContext, task: ForgeListrTask<PublishContext>) => {
        if (publishers.length === 0) {
          task.output = 'No publishers configured';
          task.skip();
          return;
        }

        return task.newListr<never>(
          publishers.map((publisher) => ({
            title: `${chalk.cyan(`[publisher-${publisher.name}]`)} Running the ${chalk.yellow('publish')} command`,
            task: async (_, task) => {
              const setStatusLine = (s: string) => {
                task.output = s;
              };
              await publisher.publish({
                dir,
                makeResults: makeResults!,
                forgeConfig,
                setStatusLine,
              });
            },
            options: {
              persistentOutput: true,
            },
          })),
          {
            rendererOptions: {
              collapse: false,
              collapseErrors: false,
            },
          }
        );
      },
      options: {
        persistentOutput: true,
      },
    },
  ];

  const runner = new Listr<PublishContext>(
    [
      {
        title: 'Loading configuration',
        task: async (ctx) => {
          const resolvedDir = await resolveDir(providedDir);
          if (!resolvedDir) {
            throw new Error('Failed to locate publishable Electron application');
          }

          ctx.dir = resolvedDir;
          ctx.forgeConfig = await getForgeConfig(resolvedDir);
        },
      },
      {
        title: 'Resolving publish targets',
        task: async (ctx: PublishContext, task: ForgeListrTask<PublishContext>) => {
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
              const PublisherClass: any = requireSearch(dir, [resolvablePublishTarget.name]);
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
        },
        options: {
          persistentOutput: true,
        },
      },
      {
        title: dryRunResume ? 'Resuming from dry run...' : `Running ${chalk.yellow('make')} command`,
        task: async (ctx, task) => {
          const { dir, forgeConfig } = ctx;
          const calculatedOutDir = outDir || getCurrentOutDir(dir, forgeConfig);
          const dryRunDir = path.resolve(calculatedOutDir, 'publish-dry-run');

          if (dryRunResume) {
            d('attempting to resume from dry run');
            const publishes = await PublishState.loadFromDirectory(dryRunDir, dir);
            task.title = `Resuming ${publishes.length} found dry runs...`;

            return task.newListr<PublishContext>(
              publishes.map((publishStates, index) => {
                return {
                  title: `Publishing dry-run ${chalk.blue(`#${index + 1}`)}`,
                  task: async (ctx: PublishContext, task: ForgeListrTask<PublishContext>) => {
                    const restoredMakeResults = publishStates.map(({ state }) => state);
                    d('restoring publish settings from dry run');

                    for (const makeResult of restoredMakeResults) {
                      for (const makePath of makeResult.artifacts) {
                        if (!(await fs.pathExists(makePath))) {
                          throw new Error(`Attempted to resume a dry run but an artifact (${makePath}) could not be found`);
                        }
                      }
                    }

                    d('publishing for given state set');
                    return task.newListr(publishDistributablesTasks, {
                      ctx: {
                        ...ctx,
                        makeResults: restoredMakeResults,
                      },
                      rendererOptions: {
                        collapse: false,
                        collapseErrors: false,
                      },
                    });
                  },
                };
              }),
              {
                rendererOptions: {
                  collapse: false,
                  collapseErrors: false,
                },
              }
            );
          }

          d('triggering make');
          return listrMake(
            {
              dir,
              interactive,
              ...makeOptions,
            },
            (results) => {
              ctx.makeResults = results;
            }
          );
        },
      },
      ...(dryRunResume
        ? []
        : dryRun
        ? [
            {
              title: 'Saving dry-run state',
              task: async ({ dir, forgeConfig, makeResults }: PublishContext) => {
                d('saving results of make in dry run state', makeResults);
                const calculatedOutDir = outDir || getCurrentOutDir(dir, forgeConfig);
                const dryRunDir = path.resolve(calculatedOutDir, 'publish-dry-run');

                await fs.remove(dryRunDir);
                await PublishState.saveToDirectory(dryRunDir, makeResults!, dir);
              },
            },
          ]
        : publishDistributablesTasks),
    ],
    listrOptions
  );

  await runner.run();
};

export default publish;

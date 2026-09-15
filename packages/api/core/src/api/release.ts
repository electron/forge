import { styleText } from 'node:util';

import { pathExists } from '@electron-forge/core-utils';
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
} from '@electron-forge/shared-types';
import { autoTrace, delayTraceTillSignal } from '@electron-forge/tracer';
import debug from 'debug';
import { Listr } from 'listr2';

import getForgeConfig from '../util/forge-config.js';
import { importSearch } from '../util/import-search.js';
import { loadMakeResults } from '../util/make-results.js';
import getCurrentOutDir from '../util/out-dir.js';
import resolveDir from '../util/resolve-dir.js';

import { listrMake, MakeOptions } from './make.js';

const d = debug('electron-forge:release');

type ReleaseContext = {
  dir: string;
  forgeConfig: ResolvedForgeConfig;
  publishers: PublisherBase<unknown>[];
  makeResults: ForgeMakeResult[];
};

export interface ReleaseOptions {
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
   * Skip the package and make steps, and release the artifacts saved by a
   * previous `make` run instead.
   *
   * Every `make` run saves a manifest of its results in `<outDir>/make-results`
   * next to the artifacts in `<outDir>/make`. Setting this to true loads those
   * manifests (from every platform and architecture that was made) and
   * releases them without rebuilding, e.g. from a CI job that only has the
   * artifacts other jobs built.
   */
  skipMake?: boolean;
  /**
   * Run the package and make steps but do not release anything.
   *
   * @deprecated `make()` now always saves its results, so this is equivalent
   * to calling `make()` instead of `release()`. This option will be removed in
   * a future major version.
   */
  dryRun?: boolean;
  /**
   * @deprecated Use {@link ReleaseOptions.skipMake} instead. This alias will be
   * removed in a future major version.
   */
  dryRunResume?: boolean;
}

export default autoTrace(
  { name: 'release()', category: '@electron-forge/core' },
  async (
    childTrace,
    {
      dir: providedDir = process.cwd(),
      interactive = false,
      makeOptions = {},
      publishTargets = undefined,
      skipMake = false,
      dryRun = false,
      dryRunResume = false,
      outDir,
    }: ReleaseOptions,
  ): Promise<void> => {
    // `dryRunResume` is the deprecated name for `skipMake`
    skipMake = skipMake || dryRunResume;
    if (dryRun && skipMake) {
      throw new Error(
        "Can't skip the make step and dry run at the same time: there would be nothing to do",
      );
    }

    const listrOptions: ForgeListrOptions<ReleaseContext> = {
      concurrent: false,
      rendererOptions: {
        collapseErrors: false,
      },
      silentRendererCondition: !interactive,
      fallbackRendererCondition:
        Boolean(process.env.DEBUG) || Boolean(process.env.CI),
    };

    const publishDistributablesTasks = (childTrace: typeof autoTrace) => [
      {
        title: 'Publishing distributables',
        task: childTrace<Parameters<ForgeListrTaskFn<ReleaseContext>>>(
          { name: 'publish-distributables', category: '@electron-forge/core' },
          async (
            childTrace,
            { dir, forgeConfig, makeResults, publishers },
            task: ForgeListrTask<ReleaseContext>,
          ) => {
            if (publishers.length === 0) {
              task.output = 'No publishers configured';
              task.skip();
              return;
            }

            return delayTraceTillSignal(
              childTrace,
              task.newListr<never>(
                publishers.map((publisher) => ({
                  title: `${styleText('cyan', `[publisher-${publisher.name}]`)} Running the ${styleText('yellow', 'publish')} command`,
                  task: childTrace<Parameters<ForgeListrTaskFn>>(
                    {
                      name: `publish-${publisher.name}`,
                      category: '@electron-forge/core',
                    },
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
                    },
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
                },
              ),
              'run',
            );
          },
        ),
        rendererOptions: {
          persistentOutput: true,
        },
      },
    ];

    const runner = new Listr<ReleaseContext>(
      [
        {
          title: 'Loading configuration',
          task: childTrace<Parameters<ForgeListrTaskFn<ReleaseContext>>>(
            { name: 'load-forge-config', category: '@electron-forge/core' },
            async (childTrace, ctx) => {
              const resolvedDir = await resolveDir(providedDir);
              if (!resolvedDir) {
                throw new Error(
                  'Failed to locate publishable Electron application',
                );
              }

              ctx.dir = resolvedDir;
              ctx.forgeConfig = await getForgeConfig(resolvedDir);
            },
          ),
        },
        {
          title: 'Resolving publish targets',
          task: childTrace<Parameters<ForgeListrTaskFn<ReleaseContext>>>(
            {
              name: 'resolve-publish-targets',
              category: '@electron-forge/core',
            },
            async (childTrace, ctx, task) => {
              const { dir, forgeConfig } = ctx;

              if (!publishTargets) {
                publishTargets = forgeConfig.publishers || [];
              }
              publishTargets = (publishTargets as ForgeConfigPublisher[]).map(
                (target) => {
                  if (typeof target === 'string') {
                    return (
                      (forgeConfig.publishers || []).find(
                        (p: ForgeConfigPublisher) => {
                          if (typeof p === 'string') return false;
                          if ((p as IForgePublisher).__isElectronForgePublisher)
                            return false;
                          return (
                            (p as IForgeResolvablePublisher).name === target
                          );
                        },
                      ) || { name: target }
                    );
                  }
                  return target;
                },
              );

              ctx.publishers = [];
              for (const publishTarget of publishTargets) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let publisher: PublisherBase<any>;
                if (
                  (publishTarget as IForgePublisher).__isElectronForgePublisher
                ) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  publisher = publishTarget as PublisherBase<any>;
                } else {
                  const resolvablePublishTarget =
                    publishTarget as IForgeResolvablePublisher;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const PublisherClass: any = await importSearch(dir, [
                    resolvablePublishTarget.name,
                  ]);
                  if (!PublisherClass) {
                    throw new Error(
                      `Could not find a publish target with the name: ${resolvablePublishTarget.name}. Make sure it's listed in the devDependencies of your package.json`,
                    );
                  }

                  publisher = new PublisherClass(
                    resolvablePublishTarget.config || {},
                    resolvablePublishTarget.platforms,
                  );
                }

                ctx.publishers.push(publisher);
              }

              if (ctx.publishers.length) {
                task.output = `Publishing to the following targets: ${styleText('magenta', `${ctx.publishers.map((publisher) => publisher.name).join(', ')}`)}`;
              }
            },
          ),
          rendererOptions: {
            persistentOutput: true,
          },
        },
        {
          title: skipMake
            ? `Loading results from previous ${styleText('yellow', 'make')} run`
            : `Running ${styleText('yellow', 'make')} command`,
          task: childTrace<Parameters<ForgeListrTaskFn<ReleaseContext>>>(
            {
              name: skipMake ? 'load-make-results' : 'make()',
              category: '@electron-forge/core',
            },
            async (childTrace, ctx, task) => {
              const { dir, forgeConfig } = ctx;
              const calculatedOutDir =
                outDir || getCurrentOutDir(dir, forgeConfig);

              if (skipMake) {
                d('loading results of previous make runs');
                const makeRuns = await loadMakeResults(calculatedOutDir, dir);
                task.title = `Loaded results from ${makeRuns.length} previous ${styleText('yellow', 'make')} ${makeRuns.length === 1 ? 'run' : 'runs'}`;

                return delayTraceTillSignal(
                  childTrace,
                  task.newListr<ReleaseContext>(
                    makeRuns.map((restoredMakeResults, index) => {
                      return {
                        title: `Releasing artifacts from ${styleText('yellow', 'make')} run ${styleText('blue', `#${index + 1}`)}`,
                        task: childTrace<
                          Parameters<ForgeListrTaskFn<ReleaseContext>>
                        >(
                          {
                            name: `release-make-run-${index + 1}`,
                            category: '@electron-forge/core',
                          },
                          async (childTrace, ctx, task) => {
                            d('verifying artifacts from previous make run');
                            for (const makeResult of restoredMakeResults) {
                              for (const artifact of makeResult.artifacts) {
                                if (!(await pathExists(artifact))) {
                                  throw new Error(
                                    `Attempted to release the artifacts from a previous make run, but ${artifact} could not be found. Make sure the make output (the "make" and "make-results" directories in ${calculatedOutDir}) is available.`,
                                  );
                                }
                              }
                            }

                            d('releasing the restored make results');
                            return delayTraceTillSignal(
                              childTrace,
                              task.newListr(
                                publishDistributablesTasks(childTrace),
                                {
                                  ctx: {
                                    ...ctx,
                                    makeResults: restoredMakeResults,
                                  },
                                  rendererOptions: {
                                    collapseSubtasks: false,
                                    collapseErrors: false,
                                  },
                                },
                              ),
                              'run',
                            );
                          },
                        ),
                      };
                    }),
                    {
                      rendererOptions: {
                        collapseSubtasks: false,
                        collapseErrors: false,
                      },
                    },
                  ),
                  'run',
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
                    outDir,
                    ...makeOptions,
                  },
                  (results) => {
                    ctx.makeResults = results;
                  },
                ),
                'run',
              );
            },
          ),
        },
        // When skipping make, the publishers run per restored make run in the
        // task above. When dry running, make has already saved its results
        // and there is nothing left to do.
        ...(skipMake || dryRun ? [] : publishDistributablesTasks(childTrace)),
      ],
      listrOptions,
    );

    await runner.run();
  },
);

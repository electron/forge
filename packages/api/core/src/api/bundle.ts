import { getHostArch } from '@electron/get';
import {
  ForgeArch,
  ForgeListrTaskFn,
  ForgePlatform,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import { autoTrace, delayTraceTillSignal } from '@electron-forge/tracer';
import chalk from 'chalk';
import debug from 'debug';
import { Listr } from 'listr2';

import getForgeConfig from '../util/forge-config';
import { getHookListrTasks } from '../util/hook';
import { readMutatedPackageJson } from '../util/read-package-json';
import resolveDir from '../util/resolve-dir';

const d = debug('electron-forge:bundle');

type BundleContext = {
  dir: string;
  forgeConfig: ResolvedForgeConfig;
  packageJSON: any;
};

export interface BundleOptions {
  /**
   * The path to the app to bundle
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
   * The target platform
   */
  platform?: ForgePlatform;
}

export const listrBundle = (
  childTrace: typeof autoTrace,
  {
    dir: providedDir = process.cwd(),
    interactive = false,
    arch = getHostArch() as ForgeArch,
    platform = process.platform as ForgePlatform,
  }: BundleOptions,
) => {
  d('bundling with options', { providedDir, interactive, arch, platform });

  const runner = new Listr<BundleContext>(
    [
      {
        title: 'Preparing to bundle application',
        task: childTrace<Parameters<ForgeListrTaskFn<BundleContext>>>(
          { name: 'bundle-prepare', category: '@electron-forge/core' },
          async (_, ctx) => {
            const resolvedDir = await resolveDir(providedDir);
            if (!resolvedDir) {
              throw new Error(
                'Failed to locate compilable Electron application',
              );
            }
            ctx.dir = resolvedDir;

            ctx.forgeConfig = await getForgeConfig(resolvedDir);
            ctx.packageJSON = await readMutatedPackageJson(
              resolvedDir,
              ctx.forgeConfig,
            );

            if (!ctx.packageJSON.main) {
              throw new Error(
                'packageJSON.main must be set to a valid entry point for your Electron app',
              );
            }
          },
        ),
      },
      {
        title: 'Running bundling hooks',
        task: childTrace<Parameters<ForgeListrTaskFn<BundleContext>>>(
          { name: 'run-bundling-hooks', category: '@electron-forge/core' },
          async (childTrace, { forgeConfig }, task) => {
            return delayTraceTillSignal(
              childTrace,
              task.newListr([
                {
                  title: `Running ${chalk.yellow('generateAssets')} hook`,
                  task: childTrace<Parameters<ForgeListrTaskFn>>(
                    {
                      name: 'run-generateAssets-hook',
                      category: '@electron-forge/core',
                    },
                    async (childTrace, _, task) => {
                      return delayTraceTillSignal(
                        childTrace,
                        task.newListr(
                          await getHookListrTasks(
                            childTrace,
                            forgeConfig,
                            'generateAssets',
                            platform,
                            arch,
                          ),
                        ),
                        'run',
                      );
                    },
                  ),
                },
                {
                  title: `Running ${chalk.yellow('prePackage')} hook`,
                  task: childTrace<Parameters<ForgeListrTaskFn>>(
                    {
                      name: 'run-prePackage-hook',
                      category: '@electron-forge/core',
                    },
                    async (childTrace, _, task) => {
                      return delayTraceTillSignal(
                        childTrace,
                        task.newListr(
                          await getHookListrTasks(
                            childTrace,
                            forgeConfig,
                            'prePackage',
                            platform,
                            arch,
                          ),
                        ),
                        'run',
                      );
                    },
                  ),
                },
              ]),
              'run',
            );
          },
        ),
      },
    ],
    {
      concurrent: false,
      silentRendererCondition: !interactive,
      fallbackRendererCondition:
        Boolean(process.env.DEBUG) || Boolean(process.env.CI),
      rendererOptions: {
        collapseSubtasks: false,
        collapseErrors: false,
      },
      ctx: {} as BundleContext,
    },
  );

  return runner;
};

export default autoTrace(
  { name: 'bundle()', category: '@electron-forge/core' },
  async (childTrace, opts: BundleOptions): Promise<void> => {
    const runner = listrBundle(childTrace, opts);
    await runner.run();
  },
);

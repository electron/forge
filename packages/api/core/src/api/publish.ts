import { asyncOra } from '@electron-forge/async-ora';
import {
  IForgeResolvablePublisher,
  IForgePublisher,
  ForgeConfigPublisher,
  ForgeMakeResult,
  // ForgePlatform,
} from '@electron-forge/shared-types';
import PublisherBase from '@electron-forge/publisher-base';

import chalk from 'chalk';
import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';

import getForgeConfig from '../util/forge-config';
import resolveDir from '../util/resolve-dir';
import PublishState from '../util/publish-state';
import getCurrentOutDir from '../util/out-dir';

import make, { MakeOptions } from './make';
import requireSearch from '../util/require-search';

const d = debug('electron-forge:publish');

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
  publishTargets?: ForgeConfigPublisher[];
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
  /**
   * Provide results from make so that the publish step doesn't run make itself
   */
  makeResults?: ForgeMakeResult[];
}

const publish = async ({
  dir = process.cwd(),
  interactive = false,
  makeOptions = {},
  publishTargets = undefined,
  dryRun = false,
  dryRunResume = false,
  makeResults = undefined,
  outDir,
}: PublishOptions): Promise<void> => {
  asyncOra.interactive = interactive;

  if (dryRun && dryRunResume) {
    throw new Error("Can't dry run and resume a dry run at the same time");
  }
  if (dryRunResume && makeResults) {
    throw new Error("Can't resume a dry run and use the provided makeResults at the same time");
  }

  const forgeConfig = await getForgeConfig(dir);

  const calculatedOutDir = outDir || getCurrentOutDir(dir, forgeConfig);
  const dryRunDir = path.resolve(calculatedOutDir, 'publish-dry-run');

  if (dryRunResume) {
    d('attempting to resume from dry run');
    const publishes = await PublishState.loadFromDirectory(dryRunDir, dir);
    for (const publishStates of publishes) {
      d('publishing for given state set');
      await publish({
        dir,
        interactive,
        publishTargets,
        makeOptions,
        dryRun: false,
        dryRunResume: false,
        makeResults: publishStates.map(({ state }) => state),
      });
    }
    return;
  }

  if (!makeResults) {
    d('triggering make');
    makeResults = await make({
      dir,
      interactive,
      ...makeOptions,
    });
  } else {
    // Restore values from dry run
    d('restoring publish settings from dry run');

    for (const makeResult of makeResults) {
      makeOptions.platform = makeResult.platform;
      makeOptions.arch = makeResult.arch;

      for (const makePath of makeResult.artifacts) {
        if (!(await fs.pathExists(makePath))) {
          throw new Error(`Attempted to resume a dry run but an artifact (${makePath}) could not be found`);
        }
      }
    }
  }

  if (dryRun) {
    d('saving results of make in dry run state', makeResults);
    await fs.remove(dryRunDir);
    await PublishState.saveToDirectory(dryRunDir, makeResults, dir);
    return;
  }

  const resolvedDir = await resolveDir(dir);
  if (!resolvedDir) {
    throw new Error('Failed to locate publishable Electron application');
  }
  dir = resolvedDir;

  // const testPlatform = makeOptions.platform || process.platform as ForgePlatform;
  if (!publishTargets) {
    publishTargets = forgeConfig.publishers || [];
    // .filter(publisher => (typeof publisher !== 'string' && publisher.platforms)
    //   ? publisher.platforms.includes(testPlatform) : true);
  }
  publishTargets = (publishTargets as ForgeConfigPublisher[]).map((target) => {
    if (typeof target === 'string') {
      return (
        (forgeConfig.publishers || []).find((p: ForgeConfigPublisher) => {
          if (typeof p === 'string') return false;
          // eslint-disable-next-line no-underscore-dangle
          if ((p as IForgePublisher).__isElectronForgePublisher) return false;
          return (p as IForgeResolvablePublisher).name === target;
        }) || { name: target }
      );
    }
    return target;
  });

  for (const publishTarget of publishTargets) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let publisher: PublisherBase<any>;
    // eslint-disable-next-line no-underscore-dangle
    if ((publishTarget as IForgePublisher).__isElectronForgePublisher) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      publisher = publishTarget as PublisherBase<any>;
    } else {
      const resolvablePublishTarget = publishTarget as IForgeResolvablePublisher;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let PublisherClass: any;
      await asyncOra(`Resolving publish target: ${chalk.cyan(resolvablePublishTarget.name)}`, async () => {
        // eslint-disable-line no-loop-func
        PublisherClass = requireSearch(dir, [resolvablePublishTarget.name]);
        if (!PublisherClass) {
          throw new Error(
            `Could not find a publish target with the name: ${resolvablePublishTarget.name}. Make sure it's listed in the devDependencies of your package.json`
          );
        }
      });

      publisher = new PublisherClass(resolvablePublishTarget.config || {}, resolvablePublishTarget.platforms);
    }

    await publisher.publish({
      dir,
      makeResults,
      forgeConfig,
    });
  }
};

export default publish;

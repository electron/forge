import 'colors';
import { asyncOra } from '@electron-forge/async-ora';
import { IForgeResolvablePublisher, IForgePublisher, ForgeMakeResult, ForgePlatform } from '@electron-forge/shared-types';
import PublisherBase from '@electron-forge/publisher-base';
import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';

import getForgeConfig from '../util/forge-config';
import readPackageJSON from '../util/read-package-json';
import resolveDir from '../util/resolve-dir';
import PublishState from '../util/publish-state';
import getCurrentOutDir from '../util/out-dir';

import make, { MakeOptions } from './make';

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
  publishTargets?: (IForgeResolvablePublisher | IForgePublisher | string)[];
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
}: PublishOptions) => {
  asyncOra.interactive = interactive;

  if (dryRun && dryRunResume) {
    throw 'Can\'t dry run and resume a dry run at the same time';
  }
  if (dryRunResume && makeResults) {
    throw 'Can\'t resume a dry run and use the provided makeResults at the same time';
  }

  let packageJSON = await readPackageJSON(dir);

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
  } else if (!makeResults) {
    d('triggering make');
    makeResults = await make(Object.assign({
      dir,
      interactive,
    }, makeOptions));
  } else {
    // Restore values from dry run
    d('restoring publish settings from dry run');

    for (const makeResult of makeResults) {
      packageJSON = makeResult.packageJSON;
      makeOptions.platform = makeResult.platform;
      makeOptions.arch = makeResult.arch;

      for (const makePath of makeResult.artifacts) {
        if (!await fs.pathExists(makePath)) {
          throw `Attempted to resume a dry run but an artifact (${makePath}) could not be found`;
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
    throw 'Failed to locate publishable Electron application';
  }
  dir = resolvedDir;

  const testPlatform = makeOptions.platform || process.platform as ForgePlatform;
  if (!publishTargets) {
    publishTargets = (forgeConfig.publishers || [])
      // .filter(publisher => (typeof publisher !== 'string' && publisher.platforms) ? publisher.platforms.indexOf(testPlatform) !== -1 : true);
  }
  publishTargets = publishTargets.map((target) => {
    if (typeof target === 'string') return { name: target };
    return target;
  }) as (IForgeResolvablePublisher | IForgePublisher)[];

  for (const publishTarget of publishTargets) {
    let publisher: PublisherBase<any>;
    if ((publishTarget as IForgePublisher).__isElectronForgePublisher) {
      publisher = publishTarget as any;
    } else {
      const resolvablePublishTarget = publishTarget as IForgeResolvablePublisher;
      let publisherModule: any;
      await asyncOra(`Resolving publish target: ${`${resolvablePublishTarget.name}`.cyan}`, async () => { // eslint-disable-line no-loop-func
        try {
          publisherModule = require(resolvablePublishTarget.name);
        } catch (err) {
          console.error(err);
          throw `Could not find a publish target with the name: ${resolvablePublishTarget.name}`;
        }
      });

      const PublisherClass = publisherModule.default || publisherModule;
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

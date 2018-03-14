import 'colors';
import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';

import getForgeConfig from '../util/forge-config';
import readPackageJSON from '../util/read-package-json';
import resolveDir from '../util/resolve-dir';
import PublishState from '../util/publish-state';
import getCurrentOutDir from '../util/out-dir';

import make from './make';

const d = debug('electron-forge:publish');

/**
 * @typedef {Object} PublishTarget
 * @property {string} [name]
 * @property {Array<string>} [platforms=[process.platform]]
 * @property {Object} [config={}]
 */

/**
 * @typedef {Object} PublishOptions
 * @property {string} [dir=process.cwd()] The path to the app to be published
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {string} [tag=packageJSON.version] The string to tag this release with
 * @property {Array<PublishTarget>} [publishTargets=[]] The publish targets
 * @property {MakeOptions} [makeOptions] Options object to passed through to make()
 * @property {string} [outDir=`${dir}/out`] The path to the directory containing generated distributables
 * @property {boolean} [dryRun=false] Whether to generate dry run meta data but not actually publish
 * @property {boolean} [dryRunResume=false] Whether or not to attempt to resume a previously saved `dryRun` and publish
 * @property {MakeResult} [makeResults=null] Provide results from make so that the publish step doesn't run make itself
 */

/**
 * Publish an Electron application into the given target service.
 *
 * @param {PublishOptions} providedOptions - Options for the Publish method
 * @return {Promise} Will resolve when the publish process is complete
 */
const publish = async (providedOptions = {}) => {
  // eslint-disable-next-line prefer-const, no-unused-vars
  let { dir, interactive, authToken, tag, publishTargets, makeOptions, dryRun, dryRunResume, makeResults } = Object.assign({
    dir: process.cwd(),
    interactive: false,
    tag: null,
    makeOptions: {},
    publishTargets: null,
    dryRun: false,
    dryRunResume: false,
    makeResults: null,
  }, providedOptions);
  asyncOra.interactive = interactive;

  if (dryRun && dryRunResume) {
    throw 'Can\'t dry run and resume a dry run at the same time';
  }
  if (dryRunResume && makeResults) {
    throw 'Can\'t resume a dry run and use the provided makeResults at the same time';
  }

  let packageJSON = await readPackageJSON(dir);
  if (tag === null ) tag = packageJSON.version;

  const forgeConfig = await getForgeConfig(dir);
  const outDir = providedOptions.outDir || getCurrentOutDir(dir, forgeConfig);
  const dryRunDir = path.resolve(outDir, 'publish-dry-run');

  if (dryRunResume) {
    d('attempting to resume from dry run');
    const publishes = await PublishState.loadFromDirectory(dryRunDir, dir);
    for (const publishStates of publishes) {
      d('publishing for given state set');
      await publish({
        dir,
        interactive,
        authToken,
        tag,
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
        if (!await fs.exists(makePath)) {
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

  dir = await resolveDir(dir);
  if (!dir) {
    throw 'Failed to locate publishable Electron application';
  }

  const testPlatform = makeOptions.platform || process.platform;
  if (publishTargets === null) {
    publishTargets = (forgeConfig.publishers || [])
      .filter(publisher => publisher.platforms ? publisher.platforms.indexOf(testPlatform !== -1) : true);
  }
  publishTargets = publishTargets.map((target) => {
    if (typeof target === 'string') return { name: target };
    return target;
  });

  for (const publishTarget of publishTargets) {
    let publisherModule;
    await asyncOra(`Resolving publish target: ${`${publishTarget.name}`.cyan}`, async () => { // eslint-disable-line no-loop-func
      try {
        publisherModule = require(publishTarget.name);
      } catch (err) {
        console.error(err);
        throw `Could not find a publish target with the name: ${publishTarget.name}`;
      }
    });

    const PublisherClass = publisherModule.default || publisherModule;
    const publisher = new PublisherClass();

    await publisher.publish({
      dir,
      makeResults,
      packageJSON,
      config: publishTarget.config || {},
      forgeConfig,
      tag,
      platform: makeOptions.platform || process.platform,
      arch: makeOptions.arch || process.arch,
    });
  }
};

export default publish;

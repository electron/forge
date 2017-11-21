import 'colors';
import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';

import asyncOra from '../util/ora-handler';
import getForgeConfig from '../util/forge-config';
import readPackageJSON from '../util/read-package-json';
import requireSearch from '../util/require-search';
import resolveDir from '../util/resolve-dir';
import PublishState from '../util/publish-state';

import make from './make';

const d = debug('electron-forge:publish');

/**
 * @typedef {Object} PublishOptions
 * @property {string} [dir=process.cwd()] The path to the app to be published
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {string} [authToken] An authentication token to use when publishing
 * @property {string} [tag=packageJSON.version] The string to tag this release with
 * @property {Array<string>} [publishTargets=[github]] The publish targets
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

  const outDir = providedOptions.outDir || path.resolve(dir, 'out');
  const dryRunDir = path.resolve(outDir, 'publish-dry-run');

  if (dryRun && dryRunResume) {
    throw 'Can\'t dry run and resume a dry run at the same time';
  }
  if (dryRunResume && makeResults) {
    throw 'Can\'t resume a dry run and use the provided makeResults at the same time';
  }

  let packageJSON = await readPackageJSON(dir);

  const forgeConfig = await getForgeConfig(dir);

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

  const artifacts = makeResults.reduce((accum, makeResult) => {
    accum.push(...makeResult.artifacts);
    return accum;
  }, []);

  if (publishTargets === null) {
    publishTargets = forgeConfig.publish_targets[makeOptions.platform || process.platform];
  }

  for (const publishTarget of publishTargets) {
    let publisher;
    await asyncOra(`Resolving publish target: ${`${publishTarget}`.cyan}`, async () => { // eslint-disable-line no-loop-func
      publisher = requireSearch(__dirname, [
        `../publishers/${publishTarget}.js`,
        `electron-forge-publisher-${publishTarget}`,
        publishTarget,
        path.resolve(dir, publishTarget),
        path.resolve(dir, 'node_modules', publishTarget),
      ]);
      if (!publisher) {
        throw `Could not find a publish target with the name: ${publishTarget}`;
      }
    });

    await publisher(artifacts, packageJSON, forgeConfig, authToken, tag, makeOptions.platform || process.platform, makeOptions.arch || process.arch);
  }
};

export default publish;

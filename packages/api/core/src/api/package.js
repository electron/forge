import 'colors';
import debug from 'debug';
import fs from 'fs-extra';
import glob from 'glob';
import path from 'path';
import pify from 'pify';
import packager from 'electron-packager';
import { hostArch } from 'electron-packager/targets';

import getForgeConfig from '../util/forge-config';
import runHook from '../util/hook';
import { warn } from '../util/messages';
import realOra, { fakeOra } from '../util/ora';
import readPackageJSON from '../util/read-package-json';
import rebuildHook from '../util/rebuild';
import requireSearch from '../util/require-search';
import resolveDir from '../util/resolve-dir';
import getCurrentOutDir from '../util/out-dir';
import getElectronVersion from '../util/electron-version';

const d = debug('electron-forge:packager');

/**
 * @typedef {Object} PackageOptions
 * @property {string} [dir=process.cwd()] The path to the app to package
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {string} [arch=process.arch] The target arch
 * @property {string} [platform=process.platform] The target platform.
 * @property {string} [outDir=`${dir}/out`] The path to the output directory for packaged apps
 */

/**
 * Resolves hooks if they are a path to a file (instead of a `Function`).
 */
function resolveHooks(hooks, dir) {
  if (hooks) {
    return hooks.map(hook => (typeof hook === 'string' ? requireSearch(dir, [hook]) : hook));
  }

  return [];
}

function sequentialHooks(hooks) {
  return [async (...args) => {
    const done = args[args.length - 1];
    const passedArgs = args.splice(0, args.length - 1);
    for (const hook of hooks) {
      await pify(hook)(...passedArgs);
    }
    done();
  }];
}

/**
 * Package an Electron application into an platform dependent format.
 *
 * @param {PackageOptions} providedOptions - Options for the Package method
 * @return {Promise} Will resolve when the package process is complete
 */
export default async (providedOptions = {}) => {
  // eslint-disable-next-line prefer-const, no-unused-vars
  let { dir, interactive, arch, platform } = Object.assign({
    dir: process.cwd(),
    interactive: false,
    arch: hostArch(),
    platform: process.platform,
  }, providedOptions);

  const ora = interactive ? realOra : fakeOra;

  let prepareSpinner = ora(`Preparing to Package Application for arch: ${(arch === 'all' ? 'ia32' : arch).cyan}`).start();
  let prepareCounter = 0;

  dir = await resolveDir(dir);
  if (!dir) {
    throw 'Failed to locate compilable Electron application';
  }

  const packageJSON = await readPackageJSON(dir);

  if (path.dirname(require.resolve(path.resolve(dir, packageJSON.main))) === dir) {
    console.error(`Entry point: ${packageJSON.main}`.red);
    throw 'The entry point to your application ("packageJSON.main") must be in a subfolder not in the top level directory';
  }

  const forgeConfig = await getForgeConfig(dir);
  const outDir = providedOptions.outDir || getCurrentOutDir(dir, forgeConfig);
  let packagerSpinner;

  const pruneEnabled = !('prune' in forgeConfig.packagerConfig) || forgeConfig.packagerConfig.prune;

  const rebuildHookFn = async (buildPath, electronVersion, pPlatform, pArch, done) => {
    await rebuildHook(buildPath, electronVersion, pPlatform, pArch, forgeConfig.rebuildConfig);
    packagerSpinner = ora('Packaging Application').start();
    done();
  };

  const afterCopyHooks = [
    async (buildPath, electronVersion, pPlatform, pArch, done) => {
      if (packagerSpinner) {
        packagerSpinner.succeed();
        prepareCounter += 1;
        prepareSpinner = ora(`Preparing to Package Application for arch: ${(prepareCounter === 2 ? 'armv7l' : 'x64').cyan}`).start();
      }
      const bins = await pify(glob)(path.join(buildPath, '**/.bin/**/*'));
      for (const bin of bins) {
        await fs.remove(bin);
      }
      done();
    }, async (buildPath, electronVersion, pPlatform, pArch, done) => {
      prepareSpinner.succeed();
      await runHook(forgeConfig, 'packageAfterCopy', buildPath, electronVersion, pPlatform, pArch);
      done();
    },
  ];

  if (!pruneEnabled) {
    afterCopyHooks.push(rebuildHookFn);
  }

  afterCopyHooks.push(async (buildPath, electronVersion, pPlatform, pArch, done) => {
    const copiedPackageJSON = await readPackageJSON(buildPath);
    if (copiedPackageJSON.config && copiedPackageJSON.config.forge) {
      delete copiedPackageJSON.config.forge;
    }
    await fs.writeJson(path.resolve(buildPath, 'package.json'), copiedPackageJSON, { spaces: 2 });
    done();
  });

  afterCopyHooks.push(...resolveHooks(forgeConfig.packagerConfig.afterCopy, dir));

  const afterPruneHooks = [];

  if (pruneEnabled) {
    afterPruneHooks.push(rebuildHookFn);
    afterPruneHooks.push(...resolveHooks(forgeConfig.packagerConfig.afterPrune, dir));
  }

  afterPruneHooks.push(async (buildPath, electronVersion, pPlatform, pArch, done) => {
    await runHook(forgeConfig, 'packageAfterPrune', buildPath, electronVersion, pPlatform, pArch);
    done();
  });

  const packageOpts = Object.assign({
    asar: false,
    overwrite: true,
  }, forgeConfig.packagerConfig, {
    afterCopy: sequentialHooks(afterCopyHooks),
    afterExtract: sequentialHooks(resolveHooks(forgeConfig.packagerConfig.afterExtract, dir)),
    afterPrune: sequentialHooks(afterPruneHooks),
    dir,
    arch,
    platform,
    out: outDir,
    electronVersion: getElectronVersion(packageJSON),
  });
  packageOpts.quiet = true;

  if (!packageJSON.version && !packageOpts.appVersion) {
    // eslint-disable-next-line max-len
    warn(interactive, "Please set 'version' or 'config.forge.electronPackagerConfig.appVersion' in your application's package.json so auto-updates work properly".yellow);
  }

  await runHook(forgeConfig, 'generateAssets');
  await runHook(forgeConfig, 'prePackage');

  d('packaging with options', packageOpts);

  await packager(packageOpts);

  await runHook(forgeConfig, 'postPackage');

  packagerSpinner.succeed();
};

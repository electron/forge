import 'colors';
import fs from 'fs-extra';
import path from 'path';
import { hostArch } from 'electron-packager/targets';

import asyncOra from '../util/ora-handler';
import getForgeConfig from '../util/forge-config';
import runHook from '../util/hook';
import { info, warn } from '../util/messages';
import parseArchs from '../util/parse-archs';
import readPackageJSON from '../util/read-package-json';
import resolveDir from '../util/resolve-dir';
import getCurrentOutDir from '../util/out-dir';
import getElectronVersion from '../util/electron-version';

import packager from './package';

/**
 * @typedef {Object} MakeTarget
 * @property {string} [name] The module name that exports the maker
 * @property {Array<string>} [platforms=[]] The platforms this make target should run on
 * @property {Object} [config] The arbitrary config to pass to this make target
 */

/**
 * @typedef {Object} MakeOptions
 * @property {string} [dir=process.cwd()] The path to the app from which distributables are generated
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {boolean} [skipPackage=false] Whether to skip the pre-make packaging step
 * @property {Array<MakeTarget>} [overrideTargets] An array of make targets to override your forge config
 * @property {string} [arch=host architecture] The target architecture
 * @property {string} [platform=process.platform] The target platform.
 * @property {string} [outDir=`${dir}/out`] The path to the directory containing generated distributables
 */

/**
 * @typedef {Object} MakeResult
 * @property {Array<string>} artifacts An array of paths to artifacts generated for this make run
 * @property {Object} packageJSON The state of the package.json file when the make happened
 * @property {string} platform The platform this make run was for
 * @property {string} arch The arch this make run was for
 */

/**
 * Make distributables for an Electron application.
 *
 * @param {MakeOptions} providedOptions - Options for the make method
 * @return {Promise<Array<MakeResult>>} Will resolve when the make process is complete
 */
export default async (providedOptions = {}) => {
  // eslint-disable-next-line prefer-const, no-unused-vars
  let { dir, interactive, skipPackage, overrideTargets, arch, platform } = Object.assign({
    dir: process.cwd(),
    interactive: false,
    skipPackage: false,
    arch: hostArch(),
    platform: process.platform,
  }, providedOptions);

  asyncOra.interactive = interactive;

  let forgeConfig;
  await asyncOra('Resolving Forge Config', async () => {
    dir = await resolveDir(dir);
    if (!dir) {
      throw 'Failed to locate makeable Electron application';
    }

    forgeConfig = await getForgeConfig(dir);
  });

  const outDir = providedOptions.outDir || getCurrentOutDir(dir, forgeConfig);

  const actualTargetPlatform = platform;
  platform = platform === 'mas' ? 'darwin' : platform;
  if (!['darwin', 'win32', 'linux', 'mas'].includes(actualTargetPlatform)) {
    throw new Error(`'${actualTargetPlatform}' is an invalid platform. Choices are 'darwin', 'mas', 'win32' or 'linux'`);
  }

  const makers = {};
  const targets = (overrideTargets || forgeConfig.makers.filter(
    maker => maker.platforms
      ? maker.platforms.indexOf(platform) !== -1
      : true
  )).map((target) => {
    if (typeof target === 'string') {
      return { name: target };
    }
    return target;
  });

  for (const target of targets) {
    let makerModule;
    try {
      makerModule = require(target.name);
    } catch (err) {
      console.error(err);
      throw `Could not find module with name: ${target.name}`;
    }

    const MakerClass = makerModule.default || makerModule;
    const maker = new MakerClass();

    if (!maker.isSupportedOnCurrentPlatform) {
      throw new Error([
        `Maker for target ${maker.name} is incompatible with this version of `,
        'electron-forge, please upgrade or contact the maintainer ',
        '(needs to implement \'isSupportedOnCurrentPlatform)\')',
      ].join(''));
    }

    if (!await maker.isSupportedOnCurrentPlatform()) {
      throw new Error([
        `Cannot build for ${platform} and target ${maker.name}: the maker declared `,
        `that it cannot run on ${process.platform}`,
      ].join(''));
    }

    makers[target.name] = maker;
  }

  if (!skipPackage) {
    info(interactive, 'We need to package your application before we can make it'.green);
    await packager({
      dir,
      interactive,
      arch,
      outDir,
      platform: actualTargetPlatform,
    });
  } else {
    warn(interactive, 'WARNING: Skipping the packaging step, this could result in an out of date build'.red);
  }

  info(interactive, 'Making for the following targets:', `${targets.join(', ')}`.cyan);

  const packageJSON = await readPackageJSON(dir);
  const appName = forgeConfig.packagerConfig.name || packageJSON.productName || packageJSON.name;
  let outputs = [];

  await runHook(forgeConfig, 'preMake');

  for (const targetArch of parseArchs(platform, arch, getElectronVersion(packageJSON))) {
    const packageDir = path.resolve(outDir, `${appName}-${actualTargetPlatform}-${targetArch}`);
    if (!(await fs.pathExists(packageDir))) {
      throw new Error(`Couldn't find packaged app at: ${packageDir}`);
    }

    for (const target of targets) {
      const maker = makers[target.name];

      // eslint-disable-next-line no-loop-func
      await asyncOra(`Making for target: ${maker.name} - On platform: ${actualTargetPlatform.cyan} - For arch: ${targetArch.cyan}`, async () => {
        try {
          const artifacts = await maker.make({
            dir: packageDir,
            makeDir: path.resolve(outDir, 'make'),
            appName,
            targetPlatform: actualTargetPlatform,
            targetArch,
            config: target.config || {},
            forgeConfig,
            packageJSON,
          });

          outputs.push({
            artifacts,
            packageJSON,
            platform: actualTargetPlatform,
            arch: targetArch,
          });
        } catch (err) {
          if (err) {
            throw {
              message: `An error occured while making for target: ${target.name}`,
              stack: `${err.message}\n${err.stack}`,
            };
          } else {
            throw new Error(`An unknown error occured while making for target: ${target}`);
          }
        }
      });
    }
  }

  const result = await runHook(forgeConfig, 'postMake', outputs);
  // If the postMake hooks modifies the locations / names of the outputs it must return
  // the new locations so that the publish step knows where to look
  if (Array.isArray(result)) {
    outputs = result;
  }

  return outputs;
};

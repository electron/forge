import 'colors';
import fs from 'fs-promise';
import path from 'path';

import asyncOra from '../util/ora-handler';
import electronHostArch from '../util/electron-host-arch';
import getForgeConfig from '../util/forge-config';
import { info, warn } from '../util/messages';
import readPackageJSON from '../util/read-package-json';
import { requireSearchRaw } from '../util/require-search';
import resolveDir from '../util/resolve-dir';

import packager from './package';

/**
 * @typedef {Object} MakeOptions
 * @property {string} [dir=process.cwd()] The path to the app from which distributables are generated
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {boolean} [skipPackage=false] Whether to skip the pre-make packaging step
 * @property {Array<string>} [overrideTargets] An array of make targets to override your forge config
 * @property {string} [arch=host architecture] The target architecture
 * @property {string} [platform=process.platform] The target platform.
 * @property {string} [outDir=`${dir}/out`] The path to the directory containing generated distributables
 */

/**
 * Make distributables for an Electron application.
 *
 * @param {MakeOptions} providedOptions - Options for the make method
 * @return {Promise} Will resolve when the make process is complete
 */
export default async (providedOptions = {}) => {
  // eslint-disable-next-line prefer-const, no-unused-vars
  let { dir, interactive, skipPackage, overrideTargets, arch, platform } = Object.assign({
    dir: process.cwd(),
    interactive: false,
    skipPackage: false,
    arch: electronHostArch(),
    platform: process.platform,
  }, providedOptions);

  const outDir = providedOptions.outDir || path.resolve(dir, 'out');
  asyncOra.interactive = interactive;

  let forgeConfig;
  await asyncOra('Resolving Forge Config', async () => {
    dir = await resolveDir(dir);
    if (!dir) {
      throw 'Failed to locate makeable Electron application';
    }

    forgeConfig = await getForgeConfig(dir);
  });

  const makers = {};
  const targets = overrideTargets || forgeConfig.make_targets[platform];

  targets.forEach((target) => {
    const maker = requireSearchRaw(__dirname, [
      `../makers/${platform}/${target}.js`,
      `../makers/generic/${target}.js`,
      `electron-forge-maker-${target}`,
      target,
      path.resolve(dir, target),
      path.resolve(dir, 'node_modules', target),
    ]);

    if (!maker) {
      throw `Could not find a build target with the name: ${target} for the platform: ${platform}`;
    }

    if (platform !== process.platform && (!maker.supportedPlatforms || maker.supportedPlatforms.indexOf(process.platform) === -1)) {
      throw `Cannot build for ${platform} target ${target} from your ${process.platform} device`;
    }

    makers[target] = maker.default;
  });

  if (!skipPackage) {
    info(interactive, 'We need to package your application before we can make it'.green);
    await packager({
      dir,
      interactive,
      arch,
      platform,
      outDir,
    });
  } else {
    warn(interactive, 'WARNING: Skipping the packaging step, this could result in an out of date build'.red);
  }

  const declaredArch = arch;

  info(interactive, 'Making for the following targets:', `${targets.join(', ')}`.cyan);

  let targetArchs = [declaredArch];
  if (declaredArch === 'all') {
    switch (platform) {
      case 'darwin':
        targetArchs = ['x64'];
        break;
      case 'linux':
        targetArchs = ['ia32', 'x64', 'armv7l'];
        break;
      case 'win32':
      default:
        targetArchs = ['ia32', 'x64'];
        break;
    }
  }

  const packageJSON = await readPackageJSON(dir);
  const appName = forgeConfig.electronPackagerConfig.name || packageJSON.productName || packageJSON.name;
  const outputs = [];

  for (const targetArch of targetArchs) {
    const packageDir = path.resolve(outDir, `${appName}-${platform}-${targetArch}`);
    if (!(await fs.exists(packageDir))) {
      throw new Error(`Couldn't find packaged app at: ${packageDir}`);
    }

    for (const target of targets) {
      const maker = makers[target];

      // eslint-disable-next-line no-loop-func
      await asyncOra(`Making for target: ${target.cyan} - On platform: ${platform.cyan} - For arch: ${targetArch.cyan}`, async () => {
        try {
          outputs.push(await (maker.default || maker)({
            dir: packageDir,
            appName,
            targetPlatform: platform,
            targetArch,
            forgeConfig,
            packageJSON,
          }));
        } catch (err) {
          if (err) {
            throw {
              message: `An error occured while making for target: ${target}`,
              stack: `${err.message}\n${err.stack}`,
            };
          } else {
            throw new Error(`An unknown error occured while making for target: ${target}`);
          }
        }
      });
    }
  }

  return outputs;
};

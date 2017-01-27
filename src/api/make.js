import 'colors';
import fs from 'fs-promise';
import path from 'path';

import asyncOra from '../util/ora-handler';
import electronHostArch from '../util/electron-host-arch';
import getForgeConfig from '../util/forge-config';
import readPackageJSON from '../util/read-package-json';
import requireSearch from '../util/require-search';
import resolveDir from '../util/resolve-dir';

import packager from './package';

/**
 * @typedef {Object} MakeOptions
 * @property {string} [dir=process.cwd()] The path to the app from which distributables are generated
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {boolean} [skipPackage=false] Whether to skip the pre-make packaging step
 * @property {Array<string>} [overrideTargets] An array of make targets to override your forge config
 * @property {string} [arch=host architecture] The target architecture
 * @property {string} [platform=process.platform] The target platform. NOTE: This is limited to be the current platform at the moment
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
  asyncOra.interactive = interactive;

  let forgeConfig;
  await asyncOra('Resolving Forge Config', async () => {
    dir = await resolveDir(dir);
    if (!dir) {
      throw 'Failed to locate makeable Electron application';
    }

    forgeConfig = await getForgeConfig(dir);
  });

  if (platform && platform !== process.platform && !(process.platform === 'darwin' && platform === 'mas')) {
    console.error('You can not "make" for a platform other than your systems platform'.red);
    process.exit(1);
  }

  if (!skipPackage) {
    console.info('We need to package your application before we can make it'.green);
    await packager({
      dir,
      interactive,
      arch,
      platform,
    });
  } else {
    console.warn('WARNING: Skipping the packaging step, this could result in an out of date build'.red);
  }

  const declaredArch = arch;
  const declaredPlatform = platform;

  let targets = forgeConfig.make_targets[declaredPlatform];
  if (overrideTargets) {
    targets = overrideTargets;
  }

  console.info('Making for the following targets:', `${targets.join(', ')}`.cyan);

  let targetArchs = [declaredArch];
  if (declaredArch === 'all') {
    switch (process.platform) {
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
    const packageDir = path.resolve(dir, `out/${appName}-${declaredPlatform}-${targetArch}`);
    if (!(await fs.exists(packageDir))) {
      throw new Error(`Couldn't find packaged app at: ${packageDir}`);
    }

    for (const target of targets) {
      // eslint-disable-next-line no-loop-func
      await asyncOra(`Making for target: ${target.cyan} - On platform: ${declaredPlatform.cyan} - For arch: ${targetArch.cyan}`, async () => {
        const maker = requireSearch(__dirname, [
          `../makers/${process.platform}/${target}.js`,
          `../makers/generic/${target}.js`,
          `electron-forge-maker-${target}`,
        ]);
        if (!maker) {
          throw `Could not find a build target with the name: ${target} for the platform: ${declaredPlatform}`;
        }
        try {
          outputs.push(await (maker.default || maker)(packageDir, appName, targetArch, forgeConfig, packageJSON));
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

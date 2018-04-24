import 'colors';
import { asyncOra } from '@electron-forge/async-ora';
import { IForgeResolvableMaker, ForgeConfig, ForgeArch, ForgePlatform, ForgeMakeResult } from '@electron-forge/shared-types';
import MakerBase from '@electron-forge/maker-base';
import fs from 'fs-extra';
import path from 'path';

import getForgeConfig from '../util/forge-config';
import runHook from '../util/hook';
import { info, warn } from '../util/messages';
import parseArchs from '../util/parse-archs';
import readPackageJSON from '../util/read-package-json';
import resolveDir from '../util/resolve-dir';
import getCurrentOutDir from '../util/out-dir';
import getElectronVersion from '../util/electron-version';

import packager from './package';

const { hostArch } = require('electron-packager/targets');

export interface MakeOptions {
  /**
   * The path to the app from which distrubutables are generated
   */
  dir?: string;
  /**
   * Whether to use sensible defaults or prompt the user visually
   */
  interactive?: boolean;
  /**
   * Whether to skip the pre-make packaging step
   */
  skipPackage?: boolean;
  /**
   * An array of make targets to override your forge config
   */
  overrideTargets?: (IForgeResolvableMaker | MakerBase<any>)[];
  /**
   * The target architecture
   */
  arch?: ForgeArch;
  /**
   * The target platform
   */
  platform?: ForgePlatform;
  /**
   * The path to the directory containing generated distributables
   */
  outDir?: string;
}

export default async ({
  dir = process.cwd(),
  interactive = false,
  skipPackage = false,
  arch = hostArch(),
  platform = process.platform as ForgePlatform,
  overrideTargets,
  outDir,
}: MakeOptions) => {

  asyncOra.interactive = interactive;

  let forgeConfig!: ForgeConfig;
  await asyncOra('Resolving Forge Config', async () => {
    const resolvedDir = await resolveDir(dir);
    if (!resolvedDir) {
      throw 'Failed to locate makeable Electron application';
    }
    dir = resolvedDir;

    forgeConfig = await getForgeConfig(dir);
  });

  const actualOutDir = outDir || getCurrentOutDir(dir, forgeConfig);

  const actualTargetPlatform = platform;
  platform = platform === 'mas' ? 'darwin' : platform;
  if (!['darwin', 'win32', 'linux', 'mas'].includes(actualTargetPlatform)) {
    throw new Error(`'${actualTargetPlatform}' is an invalid platform. Choices are 'darwin', 'mas', 'win32' or 'linux'`);
  }

  const makers: {
    [key: number]: MakerBase<any>;
  } = {};
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

  let targetId = 0;
  for (const target of targets) {
    let maker: MakerBase<any>;
    if ((target as MakerBase<any>).__isElectronForgeMaker) {
      maker = target as MakerBase<any>;
    } else {
      const resolvableTarget: IForgeResolvableMaker = target as IForgeResolvableMaker;
      let makerModule;
      try {
        makerModule = require(resolvableTarget.name);
      } catch (err) {
        console.error(err);
        throw `Could not find module with name: ${resolvableTarget.name}`;
      }

      const MakerClass = makerModule.default || makerModule;
      maker = new MakerClass(resolvableTarget.config, resolvableTarget.platforms);
    }

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

    makers[targetId] = maker;
    targetId += 1;
  }

  if (!skipPackage) {
    info(interactive, 'We need to package your application before we can make it'.green);
    await packager({
      dir,
      interactive,
      arch,
      outDir: actualOutDir,
      platform: actualTargetPlatform,
    });
  } else {
    warn(interactive, 'WARNING: Skipping the packaging step, this could result in an out of date build'.red);
  }

  info(interactive, `Making for the following targets: ${`${targets.join(', ')}`.cyan}`);

  const packageJSON = await readPackageJSON(dir);
  const appName = forgeConfig.packagerConfig.name || packageJSON.productName || packageJSON.name;
  let outputs: ForgeMakeResult[] = [];

  await runHook(forgeConfig, 'preMake');

  for (const targetArch of parseArchs(platform, arch, getElectronVersion(packageJSON))) {
    const packageDir = path.resolve(actualOutDir, `${appName}-${actualTargetPlatform}-${targetArch}`);
    if (!(await fs.pathExists(packageDir))) {
      throw new Error(`Couldn't find packaged app at: ${packageDir}`);
    }

    targetId = 0;
    for (const target of targets) {
      const maker = makers[targetId];
      targetId += 1;

      // eslint-disable-next-line no-loop-func
      await asyncOra(`Making for target: ${maker.name} - On platform: ${actualTargetPlatform.cyan} - For arch: ${targetArch.cyan}`, async () => {
        try {
          const artifacts = await maker.make({
            dir: packageDir,
            makeDir: path.resolve(actualOutDir, 'make'),
            appName,
            targetPlatform: actualTargetPlatform,
            targetArch,
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
              message: `An error occured while making for target: ${maker.name}`,
              stack: `${err.message}\n${err.stack}`,
            };
          } else {
            throw new Error(`An unknown error occured while making for target: ${maker.name}`);
          }
        }
      });
    }
  }

  const result = await runHook(forgeConfig, 'postMake', outputs) as ForgeMakeResult[] | undefined;
  // If the postMake hooks modifies the locations / names of the outputs it must return
  // the new locations so that the publish step knows where to look
  if (Array.isArray(result)) {
    outputs = result;
  }

  return outputs;
};

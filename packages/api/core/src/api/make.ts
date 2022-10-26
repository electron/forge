import path from 'path';

import { asyncOra } from '@electron-forge/async-ora';
import { MakerBase } from '@electron-forge/maker-base';
import { ForgeArch, ForgeConfigMaker, ForgeMakeResult, ForgePlatform, IForgeResolvableMaker, ResolvedForgeConfig } from '@electron-forge/shared-types';
import { getHostArch } from '@electron/get';
import chalk from 'chalk';
import filenamify from 'filenamify';
import fs from 'fs-extra';

import { getElectronVersion } from '../util/electron-version';
import getForgeConfig from '../util/forge-config';
import { runHook, runMutatingHook } from '../util/hook';
import { info, warn } from '../util/messages';
import getCurrentOutDir from '../util/out-dir';
import parseArchs from '../util/parse-archs';
import { readMutatedPackageJson } from '../util/read-package-json';
import requireSearch from '../util/require-search';
import resolveDir from '../util/resolve-dir';

import packager from './package';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class MakerImpl extends MakerBase<any> {
  name = 'impl';

  defaultPlatforms = [];
}

type MakeTargets = ForgeConfigMaker[] | string[];

function generateTargets(forgeConfig: ResolvedForgeConfig, overrideTargets?: MakeTargets) {
  if (overrideTargets) {
    return overrideTargets.map((target) => {
      if (typeof target === 'string') {
        return forgeConfig.makers.find((maker) => (maker as IForgeResolvableMaker).name === target) || ({ name: target } as IForgeResolvableMaker);
      }

      return target;
    });
  }
  return forgeConfig.makers;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isElectronForgeMaker(target: MakerBase<any> | unknown): target is MakerBase<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (target as MakerBase<any>).__isElectronForgeMaker;
}

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
  overrideTargets?: MakeTargets;
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
  arch = getHostArch() as ForgeArch,
  platform = process.platform as ForgePlatform,
  overrideTargets,
  outDir,
}: MakeOptions): Promise<ForgeMakeResult[]> => {
  asyncOra.interactive = interactive;

  let forgeConfig!: ResolvedForgeConfig;
  await asyncOra('Resolving Forge Config', async () => {
    const resolvedDir = await resolveDir(dir);
    if (!resolvedDir) {
      throw new Error('Failed to locate makeable Electron application');
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const makers: Record<number, MakerBase<any>> = {};

  let targets = generateTargets(forgeConfig, overrideTargets);

  let targetId = 0;
  for (const target of targets) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    let maker: MakerBase<any>;
    if (isElectronForgeMaker(target)) {
      maker = target;
      if (!maker.platforms.includes(actualTargetPlatform)) continue;
    } else {
      const resolvableTarget = target as IForgeResolvableMaker;
      // non-false falsy values should be 'true'
      if (resolvableTarget.enabled === false) continue;

      if (!resolvableTarget.name) {
        throw new Error(`The following maker config is missing a maker name: ${JSON.stringify(resolvableTarget)}`);
      } else if (typeof resolvableTarget.name !== 'string') {
        throw new Error(`The following maker config has a maker name that is not a string: ${JSON.stringify(resolvableTarget)}`);
      }

      const MakerClass = requireSearch<typeof MakerImpl>(dir, [resolvableTarget.name]);
      if (!MakerClass) {
        throw new Error(`Could not find module with name: ${resolvableTarget.name}. Make sure it's listed in the devDependencies of your package.json`);
      }

      maker = new MakerClass(resolvableTarget.config, resolvableTarget.platforms || undefined);
      if (!maker.platforms.includes(actualTargetPlatform)) continue;
    }

    if (!maker.isSupportedOnCurrentPlatform) {
      throw new Error(
        [
          `Maker for target ${maker.name} is incompatible with this version of `,
          'electron-forge, please upgrade or contact the maintainer ',
          "(needs to implement 'isSupportedOnCurrentPlatform)')",
        ].join('')
      );
    }

    if (!maker.isSupportedOnCurrentPlatform()) {
      throw new Error([`Cannot make for ${platform} and target ${maker.name}: the maker declared `, `that it cannot run on ${process.platform}`].join(''));
    }

    maker.ensureExternalBinariesExist();

    makers[targetId] = maker;
    targetId += 1;
  }

  if (!skipPackage) {
    info(interactive, chalk.green('We need to package your application before we can make it'));
    await packager({
      dir,
      interactive,
      arch,
      outDir: actualOutDir,
      platform: actualTargetPlatform,
    });
  } else {
    warn(interactive, chalk.red('WARNING: Skipping the packaging step, this could result in an out of date build'));
  }

  targets = targets.filter((_, i) => makers[i]);

  if (targets.length === 0) {
    throw new Error(`Could not find any make targets configured for the "${actualTargetPlatform}" platform.`);
  }

  info(interactive, `Making for the following targets: ${chalk.cyan(`${targets.map((_t, i) => makers[i].name).join(', ')}`)}`);

  const packageJSON = await readMutatedPackageJson(dir, forgeConfig);
  const appName = filenamify(forgeConfig.packagerConfig.name || packageJSON.productName || packageJSON.name, { replacement: '-' });
  const outputs: ForgeMakeResult[] = [];

  await runHook(forgeConfig, 'preMake');

  for (const targetArch of parseArchs(platform, arch, await getElectronVersion(dir, packageJSON))) {
    const packageDir = path.resolve(actualOutDir, `${appName}-${actualTargetPlatform}-${targetArch}`);
    if (!(await fs.pathExists(packageDir))) {
      throw new Error(`Couldn't find packaged app at: ${packageDir}`);
    }

    targetId = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _target of targets) {
      const maker = makers[targetId];
      targetId += 1;

      await asyncOra(
        `Making for target: ${chalk.green(maker.name)} - On platform: ${chalk.cyan(actualTargetPlatform)} - For arch: ${chalk.cyan(targetArch)}`,
        async () => {
          try {
            /**
             * WARNING: DO NOT ATTEMPT TO PARALLELIZE MAKERS
             *
             * Currently it is assumed we have 1 maker per make call but that is
             * not enforced.  It is technically possible to have 1 maker be called
             * multiple times.  The "prepareConfig" method however implicitly
             * requires a lock that is not enforced.  There are two options:
             *
             *   * Provide makers a getConfig() method
             *   * Remove support for config being provided as a method
             *   * Change the entire API of maker from a single constructor to
             *     providing a MakerFactory
             */
            maker.prepareConfig(targetArch);
            const artifacts = await maker.make({
              appName,
              forgeConfig,
              packageJSON,
              targetArch,
              dir: packageDir,
              makeDir: path.resolve(actualOutDir, 'make'),
              targetPlatform: actualTargetPlatform,
            });

            outputs.push({
              artifacts,
              packageJSON,
              platform: actualTargetPlatform,
              arch: targetArch,
            });
          } catch (err) {
            if (err instanceof Error) {
              throw {
                message: `An error occured while making for target: ${maker.name}`,
                stack: `${err.message}\n${err.stack}`,
              };
            } else if (err) {
              throw err;
            } else {
              throw new Error(`An unknown error occured while making for target: ${maker.name}`);
            }
          }
        }
      );
    }
  }

  // If the postMake hooks modifies the locations / names of the outputs it must return
  // the new locations so that the publish step knows where to look
  return runMutatingHook(forgeConfig, 'postMake', outputs);
};

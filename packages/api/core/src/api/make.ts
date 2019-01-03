import 'colors';
import { asyncOra } from '@electron-forge/async-ora';
import { IForgeResolvableMaker, ForgeConfig, ForgeArch, ForgePlatform, ForgeMakeResult } from '@electron-forge/shared-types';
import MakerBase from '@electron-forge/maker-base';
import fs from 'fs-extra';
import path from 'path';

import getForgeConfig from '../util/forge-config';
import { runHook, runMutatingHook } from '../util/hook';
import { info, warn } from '../util/messages';
import parseArchs from '../util/parse-archs';
import { readMutatedPackageJson } from '../util/read-package-json';
import resolveDir from '../util/resolve-dir';
import getCurrentOutDir from '../util/out-dir';
import { getElectronVersion } from '../util/electron-version';
import requireSearch from '../util/require-search';

import packager from './package';

const { host: hostArch }: { host: () => ForgeArch } = require('electron-download/lib/arch');

class MakerImpl extends MakerBase<any> { name = 'impl'; defaultPlatforms = []; }

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
  let targets = (overrideTargets || forgeConfig.makers).map((target) => {
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
      if (maker.platforms.indexOf(actualTargetPlatform) === -1) continue;
    } else {
      const resolvableTarget: IForgeResolvableMaker = target as IForgeResolvableMaker;
      const MakerClass = requireSearch<typeof MakerImpl>(dir, [resolvableTarget.name]);
      if (!MakerClass) {
        throw `Could not find module with name: ${resolvableTarget.name}`;
      }

      maker = new MakerClass(resolvableTarget.config, resolvableTarget.platforms || undefined);
      if (maker.platforms.indexOf(actualTargetPlatform) === -1) continue;
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
        `Cannot make for ${platform} and target ${maker.name}: the maker declared `,
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

  targets = targets.filter((_, i) => makers[i]);

  info(interactive, `Making for the following targets: ${`${targets.map((t, i) => makers[i].name).join(', ')}`.cyan}`);

  const packageJSON = await readMutatedPackageJson(dir, forgeConfig);
  const appName = forgeConfig.packagerConfig.name || packageJSON.productName || packageJSON.name;
  const outputs: ForgeMakeResult[] = [];

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
      await asyncOra(`Making for target: ${maker.name.green} - On platform: ${actualTargetPlatform.cyan} - For arch: ${targetArch.cyan}`, async () => {
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

  // If the postMake hooks modifies the locations / names of the outputs it must return
  // the new locations so that the publish step knows where to look
  return await runMutatingHook(forgeConfig, 'postMake', outputs);
};

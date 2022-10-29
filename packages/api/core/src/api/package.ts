import path from 'path';
import { promisify } from 'util';

import { fakeOra, ora as realOra } from '@electron-forge/async-ora';
import { ForgeArch, ForgePlatform } from '@electron-forge/shared-types';
import { getHostArch } from '@electron/get';
import chalk from 'chalk';
import debug from 'debug';
import packager, { FinalizeTargetMatrixHookFunction, HookFunction, TargetDefinition } from 'electron-packager';
import glob from 'fast-glob';
import fs from 'fs-extra';

import { getElectronVersion } from '../util/electron-version';
import getForgeConfig from '../util/forge-config';
import { runHook } from '../util/hook';
import { warn } from '../util/messages';
import getCurrentOutDir from '../util/out-dir';
import { readMutatedPackageJson } from '../util/read-package-json';
import rebuildHook from '../util/rebuild';
import requireSearch from '../util/require-search';
import resolveDir from '../util/resolve-dir';

const d = debug('electron-forge:packager');

/**
 * Resolves hooks if they are a path to a file (instead of a `Function`).
 */
function resolveHooks(hooks: (string | HookFunction)[] | undefined, dir: string) {
  if (hooks) {
    return hooks.map((hook) => (typeof hook === 'string' ? (requireSearch<HookFunction>(dir, [hook]) as HookFunction) : hook));
  }

  return [];
}

type DoneFunction = () => void;
type PromisifiedHookFunction = (buildPath: string, electronVersion: string, platform: string, arch: string) => Promise<void>;

/**
 * Runs given hooks sequentially by mapping them to promises and iterating
 * through while awaiting
 */
function sequentialHooks(hooks: HookFunction[]): PromisifiedHookFunction[] {
  return [
    async (buildPath: string, electronVersion: string, platform: string, arch: string, done: DoneFunction) => {
      for (const hook of hooks) {
        await promisify(hook)(buildPath, electronVersion, platform, arch);
      }
      done();
    },
  ] as PromisifiedHookFunction[];
}

export interface PackageOptions {
  /**
   * The path to the app to package
   */
  dir?: string;
  /**
   * Whether to use sensible defaults or prompt the user visually
   */
  interactive?: boolean;
  /**
   * The target arch
   */
  arch?: ForgeArch;
  /**
   * The target platform.
   */
  platform?: ForgePlatform;
  /**
   * The path to the output directory for packaged apps
   */
  outDir?: string;
}

export default async ({
  dir = process.cwd(),
  interactive = false,
  arch = getHostArch() as ForgeArch,
  platform = process.platform as ForgePlatform,
  outDir,
}: PackageOptions): Promise<void> => {
  const ora = interactive ? realOra : fakeOra;

  let spinner = ora(`Preparing to Package Application`).start();

  const resolvedDir = await resolveDir(dir);
  if (!resolvedDir) {
    throw new Error('Failed to locate compilable Electron application');
  }
  dir = resolvedDir;

  const forgeConfig = await getForgeConfig(dir);
  const packageJSON = await readMutatedPackageJson(dir, forgeConfig);

  if (!packageJSON.main) {
    throw new Error('packageJSON.main must be set to a valid entry point for your Electron app');
  }

  const calculatedOutDir = outDir || getCurrentOutDir(dir, forgeConfig);

  let pending: TargetDefinition[] = [];

  function readableTargets(targets: TargetDefinition[]) {
    return targets.map(({ platform, arch }) => `${platform}:${arch}`).join(', ');
  }

  function afterFinalizeTargetMatrixHooks(matrix: TargetDefinition[], done: Parameters<FinalizeTargetMatrixHookFunction>[1]) {
    spinner.succeed();
    spinner = ora(`Packaging for ${chalk.cyan(readableTargets(matrix))}`).start();
    pending.push(...matrix);
    done();
  }

  const pruneEnabled = !('prune' in forgeConfig.packagerConfig) || forgeConfig.packagerConfig.prune;

  const afterCopyHooks: HookFunction[] = [
    async (buildPath, electronVersion, pPlatform, pArch, done) => {
      const bins = await glob(path.join(buildPath, '**/.bin/**/*'));
      for (const bin of bins) {
        await fs.remove(bin);
      }
      done();
    },
    async (buildPath, electronVersion, pPlatform, pArch, done) => {
      await runHook(forgeConfig, 'packageAfterCopy', buildPath, electronVersion, pPlatform, pArch);
      done();
    },
    async (buildPath, electronVersion, pPlatform, pArch, done) => {
      await rebuildHook(buildPath, electronVersion, pPlatform, pArch, forgeConfig.rebuildConfig);
      done();
    },
    async (buildPath, electronVersion, pPlatform, pArch, done) => {
      const copiedPackageJSON = await readMutatedPackageJson(buildPath, forgeConfig);
      if (copiedPackageJSON.config && copiedPackageJSON.config.forge) {
        delete copiedPackageJSON.config.forge;
      }
      await fs.writeJson(path.resolve(buildPath, 'package.json'), copiedPackageJSON, { spaces: 2 });
      done();
    },
    ...resolveHooks(forgeConfig.packagerConfig.afterCopy, dir),
    async (buildPath, electronVersion, pPlatform, pArch, done) => {
      spinner.text = `Packaging for ${chalk.cyan(pArch)} complete`;
      spinner.succeed();
      pending = pending.filter(({ arch, platform }) => !(arch === pArch && platform === pPlatform));
      if (pending.length > 0) {
        spinner = ora(`Packaging for ${chalk.cyan(readableTargets(pending))}`).start();
      } else {
        spinner = ora(`Packaging complete`).start();
      }

      done();
    },
  ];

  const afterPruneHooks = [];

  if (pruneEnabled) {
    afterPruneHooks.push(...resolveHooks(forgeConfig.packagerConfig.afterPrune, dir));
  }

  afterPruneHooks.push((async (buildPath, electronVersion, pPlatform, pArch, done) => {
    await runHook(forgeConfig, 'packageAfterPrune', buildPath, electronVersion, pPlatform, pArch);
    done();
  }) as HookFunction);

  const afterExtractHooks = [
    (async (buildPath, electronVersion, pPlatform, pArch, done) => {
      await runHook(forgeConfig, 'packageAfterExtract', buildPath, electronVersion, pPlatform, pArch);
      done();
    }) as HookFunction,
  ];
  afterExtractHooks.push(...resolveHooks(forgeConfig.packagerConfig.afterExtract, dir));

  type PackagerArch = Exclude<ForgeArch, 'arm'>;

  const packageOpts: packager.Options = {
    asar: false,
    overwrite: true,
    ...forgeConfig.packagerConfig,
    dir,
    arch: arch as PackagerArch,
    platform,
    afterFinalizeTargetMatrix: [afterFinalizeTargetMatrixHooks],
    afterCopy: sequentialHooks(afterCopyHooks),
    afterExtract: sequentialHooks(afterExtractHooks),
    afterPrune: sequentialHooks(afterPruneHooks),
    out: calculatedOutDir,
    electronVersion: await getElectronVersion(dir, packageJSON),
  };
  packageOpts.quiet = true;

  if (packageOpts.all) {
    throw new Error('config.forge.packagerConfig.all is not supported by Electron Forge');
  }

  if (!packageJSON.version && !packageOpts.appVersion) {
    warn(
      interactive,
      chalk.yellow('Please set "version" or "config.forge.packagerConfig.appVersion" in your application\'s package.json so auto-updates work properly')
    );
  }

  if (packageOpts.prebuiltAsar) {
    throw new Error('config.forge.packagerConfig.prebuiltAsar is not supported by Electron Forge');
  }

  await runHook(forgeConfig, 'generateAssets', platform, arch);
  await runHook(forgeConfig, 'prePackage', platform, arch);

  d('packaging with options', packageOpts);

  const outputPaths = await packager(packageOpts);

  await runHook(forgeConfig, 'postPackage', {
    arch,
    outputPaths,
    platform,
    spinner,
  });

  if (spinner) spinner.succeed();
};

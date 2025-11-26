import path from 'node:path';

import { getNameFromAuthor } from '@electron-forge/core-utils';
import { MakerBase, type MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import chalk from 'chalk';
import { MSICreator, type MSICreatorOptions } from 'electron-wix-msi';
import logSymbols from 'log-symbols';
import semver from 'semver';

import { MakerWixConfig } from './Config.js';

export default class MakerWix extends MakerBase<MakerWixConfig> {
  name = 'wix';

  defaultPlatforms: ForgePlatform[] = ['win32'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'win32';
  }

  async make({
    dir,
    makeDir,
    targetArch,
    packageJSON,
    appName,
  }: MakerOptions): Promise<string[]> {
    const outPath = path.resolve(makeDir, `wix/${targetArch}`);
    await this.ensureDirectory(outPath);

    const { version } = packageJSON;
    const parsed = semver.parse(version);
    if (
      (Array.isArray(parsed?.prerelease) && parsed.prerelease.length > 0) ||
      (Array.isArray(parsed?.build) && parsed.build.length > 0)
    ) {
      console.warn(
        logSymbols.warning,
        chalk.yellow(
          'WARNING: MSI packages follow Windows version format "major.minor.build.revision".\n' +
            `The provided semantic version "${version}" will be transformed to Windows version format. Prerelease component will not be retained.`,
        ),
      );
    }

    const creator = new MSICreator({
      description: packageJSON.description,
      name: appName,
      version,
      manufacturer: getNameFromAuthor(packageJSON.author),
      exe: `${appName}.exe`,
      ...this.config,
      appDirectory: dir,
      outputDirectory: outPath,
    });

    if (this.config.beforeCreate) {
      await Promise.resolve(this.config.beforeCreate(creator));
    }
    await creator.create();
    const { msiFile } = await creator.compile();

    return [msiFile];
  }
}

export { MakerWix, MakerWixConfig, MSICreatorOptions };

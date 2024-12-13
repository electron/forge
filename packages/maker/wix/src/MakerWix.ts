import path from 'node:path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import chalk from 'chalk';
import { MSICreator, MSICreatorOptions } from 'electron-wix-msi/lib/creator';
import logSymbols from 'log-symbols';

import { MakerWixConfig } from './Config';
import getNameFromAuthor from './util/author-name';

export default class MakerWix extends MakerBase<MakerWixConfig> {
  name = 'wix';

  defaultPlatforms: ForgePlatform[] = ['win32'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'win32';
  }

  async make({ dir, makeDir, targetArch, packageJSON, appName }: MakerOptions): Promise<string[]> {
    const outPath = path.resolve(makeDir, `wix/${targetArch}`);
    await this.ensureDirectory(outPath);

    let { version } = packageJSON;
    if (version.includes('-')) {
      console.warn(
        logSymbols.warning,
        chalk.yellow('WARNING: WiX distributables do not handle prerelease information in the app version, removing it from the MSI')
      );
      version = this.normalizeWindowsVersion(version);
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
    } as MSICreatorOptions);

    if (this.config.beforeCreate) {
      await Promise.resolve(this.config.beforeCreate(creator));
    }
    await creator.create();
    const { msiFile } = await creator.compile();

    return [msiFile];
  }
}

export { MakerWix, MakerWixConfig, MSICreatorOptions };

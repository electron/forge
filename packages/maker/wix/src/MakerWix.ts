import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import path from 'path';

import { MSICreator, MSICreatorOptions } from 'electron-wix-msi/lib/creator';
import getNameFromAuthor from './util/author-name';


import { MakerWixConfig } from './Config';

export default class MakerWix extends MakerBase<MakerWixConfig> {
  name = 'wix';

  defaultPlatforms: ForgePlatform[] = ['win32'];

  // eslint-disable-next-line class-methods-use-this
  isSupportedOnCurrentPlatform() {
    return process.platform === 'win32';
  }

  async make({
    dir,
    makeDir,
    targetArch,
    packageJSON,
    appName,
  }: MakerOptions) {
    const outPath = path.resolve(makeDir, `wix/${targetArch}`);
    await this.ensureDirectory(outPath);

    const creator = new MSICreator(Object.assign({
      description: packageJSON.description,
      name: appName,
      version: packageJSON.version,
      manufacturer: getNameFromAuthor(packageJSON.author),
      exe: `${appName}.exe`,
    }, this.config, {
      appDirectory: dir,
      outputDirectory: outPath,
    }) as MSICreatorOptions);

    if (this.config.beforeCreate) {
      await Promise.resolve(this.config.beforeCreate(creator));
    }
    await creator.create();
    const { msiFile } = await creator.compile();

    return [msiFile];
  }
}

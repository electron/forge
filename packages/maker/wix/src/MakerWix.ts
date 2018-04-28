import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import path from 'path';

import getNameFromAuthor from './util/author-name';

import { MSICreator, MSICreatorOptions } from 'electron-wix-msi/lib/creator';

export default class MakerWix extends MakerBase<MSICreatorOptions> {
  name = 'wix';
  defaultPlatforms: ForgePlatform[] = ['win32'];

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
    const outPath = path.resolve(makeDir, `/wix/${targetArch}`);
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

    await creator.create();
    const { msiFile } = await creator.compile();

    return [msiFile];
  }
}

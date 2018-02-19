import MakerBase from '@electron-forge/maker-base';

import path from 'path';

import getNameFromAuthor from './util/author-name';

export default class MakerWix extends MakerBase {
  constructor() {
    super('wix');
  }

  isSupportedOnCurrentPlatform() {
    return process.platform === 'win32';
  }

  async make({
    dir,
    makeDir,
    targetArch,
    packageJSON,
    appName,
    config,
  }) {
    const { MSICreator } = require('electron-wix-msi');

    const outPath = path.resolve(makeDir, `/wix/${targetArch}`);
    await this.ensureDirectory(outPath);

    const creator = new MSICreator(Object.assign({
      description: packageJSON.description,
      name: appName,
      version: packageJSON.version,
      manufacturer: getNameFromAuthor(packageJSON.author),
      exe: `${appName}.exe`,
    }, config, {
      appDirectory: dir,
      outputDirectory: outPath,
    }));

    await creator.create();
    const { msiFile } = await creator.compile();

    return [msiFile];
  }
}

import path from 'path';

import { ensureDirectory } from '../../util/ensure-output';
import configFn from '../../util/config-fn';
import isInstalled from '../../util/is-installed';
import { getDistinguishedNameFromAuthor } from './appx';

export const isSupportedOnCurrentPlatform = async () => isInstalled('electron-wix-msi');

export default async ({ dir, appName, targetArch, forgeConfig, packageJSON }) => {
  const { MSICreator } = require('electron-wix-msi');

  const outPath = path.resolve(dir, `../make/wix/${targetArch}`);
  await ensureDirectory(outPath);

  const creator = new MSICreator(Object.assign({
    description: packageJSON.description,
    name: appName,
    version: packageJSON.version,
    manufacturer: getDistinguishedNameFromAuthor(packageJSON.author).substr(3),
    exe: `${appName}.exe`,
  }, configFn(forgeConfig.electronWixMSIConfig, targetArch), {
    appDirectory: dir,
    outputDirectory: outPath,
  }));

  await creator.create();
  const { msiFile } = await creator.compile();

  return [msiFile];
};

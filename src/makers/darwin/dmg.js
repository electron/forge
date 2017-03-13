import electronDMG from 'electron-installer-dmg';
import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';
import configFn from '../../util/config-fn';
import { checkSupportedPlatforms } from '../../util/check-supported-platforms';

export const supportedPlatforms = checkSupportedPlatforms('electron-installer-dmg');

export default async (dir, appName, targetArch, forgeConfig, packageJSON) => { // eslint-disable-line
  const outPath = path.resolve(dir, '../make', `${appName}.dmg`);
  await ensureFile(outPath);
  const dmgConfig = Object.assign({
    overwrite: true,
  }, configFn(forgeConfig.electronInstallerDMG, targetArch), {
    appPath: path.resolve(dir, `${appName}.app`),
    name: appName,
    out: path.dirname(outPath),
  });
  await pify(electronDMG)(dmgConfig);
  return [outPath];
};

import fs from 'fs-promise';
import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';
import configFn from '../../util/config-fn';

// electron-installer-dmg doesn't set its 'os' field even though it depends on
// appdmg, which is darwin-only
export const isSupportedOnCurrentPlatform = async () => process.platform === 'darwin';

export default async ({ dir, appName, targetArch, forgeConfig, packageJSON }) => {
  const electronDMG = require('electron-installer-dmg');

  const userConfig = configFn(forgeConfig.electronInstallerDMG, targetArch);

  const outPath = path.resolve(dir, '../make', `${userConfig.name || appName}.dmg`);
  const wantedOutPath = path.resolve(dir, '../make', `${appName}-${packageJSON.version}.dmg`);
  await ensureFile(outPath);
  const dmgConfig = Object.assign({
    overwrite: true,
    name: appName,
  }, userConfig, {
    appPath: path.resolve(dir, `${appName}.app`),
    out: path.dirname(outPath),
  });
  await pify(electronDMG)(dmgConfig);
  if (!userConfig.name) {
    await fs.rename(outPath, wantedOutPath);
  }
  return [wantedOutPath];
};

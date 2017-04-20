import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';
import configFn from '../../util/config-fn';

// electron-installer-dmg doesn't set its 'os' field even though it depends on
// appdmg, which is darwin-only
export const supportsPlatform = process.platform === 'darwin';

export default async ({ dir, appName, targetArch, forgeConfig }) => {
  const electronDMG = require('electron-installer-dmg');

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

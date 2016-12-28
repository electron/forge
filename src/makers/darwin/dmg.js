import electronDMG from 'electron-installer-dmg';
import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';

export default async (dir, appName, targetArch, forgeConfig, packageJSON) => { // eslint-disable-line
  const outPath = path.resolve(dir, '../make', `${appName}.dmg`);
  await ensureFile(outPath);
  const dmgConfig = Object.assign({
    overwrite: true,
  }, forgeConfig.electronInstallerDMG, {
    appPath: path.resolve(dir, `${appName}.app`),
    name: appName,
    out: path.dirname(outPath),
  });
  await pify(electronDMG)(dmgConfig);
  return [outPath];
};

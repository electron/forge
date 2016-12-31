import debug from 'debug';
import electronDMG from 'electron-installer-dmg';
import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';

const d = debug('electron-forge:make:dmg');

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
  d('executing electron-installer-dmg with options:', dmgConfig);
  await pify(electronDMG)(dmgConfig);
  return [outPath];
};

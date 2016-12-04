import electronDMG from 'electron-installer-dmg';
import fs from 'fs-promise';
import mkdirp from 'mkdirp';
import path from 'path';
import pify from 'pify';
import rimraf from 'rimraf';

export default async (dir, appName, forgeConfig) => {
  const outPath = path.resolve(dir, '../make', `${path.basename(dir)}.dmg`);
  if (await fs.exists(outPath)) {
    await pify(rimraf)(outPath);
  }
  await pify(mkdirp)(path.dirname(outPath));
  const dmgConfig = Object.assign({
    overwrite: true,
  }, forgeConfig.electronInstallerDMG, {
    appPath: path.resolve(dir, `${appName}.app`),
    name: appName,
    out: path.dirname(outPath),
  });
  await pify(electronDMG)(dmgConfig);
};

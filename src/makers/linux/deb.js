import installer from 'electron-installer-debian';
import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';

export default async (dir, appName, forgeConfig, packageJSON) => { // eslint-disable-line
  const outPath = path.resolve(dir, '../make/debian');

  await ensureFile(outPath);
  const debianDefaults = {
    arch: process.arch, // DOES NOT WORK WITH ARM
    dest: outPath,
    src: dir,
  };
  const debianConfig = Object.assign({}, forgeConfig.electronInstallerDebian, debianDefaults);

  await pify(installer)(debianConfig);
};

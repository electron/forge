import debug from 'debug';
import installer from 'electron-installer-redhat';
import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';

const d = debug('electron-forge:make:rpm');

function rpmArch(nodeArch) {
  switch (nodeArch) {
    case 'ia32': return 'i386';
    case 'x64': return 'x86_64';
    case 'armv7l': return 'armv7hl';
    case 'arm': return 'armv6hl';
    default: return nodeArch;
  }
}

export default async (dir, appName, targetArch, forgeConfig, packageJSON) => { // eslint-disable-line
  const arch = rpmArch(targetArch);
  const outPath = path.resolve(dir, '../make', `${packageJSON.name}-${packageJSON.version}.${arch}.rpm`);

  await ensureFile(outPath);
  const rpmDefaults = {
    arch,
    dest: path.dirname(outPath),
    src: dir,
  };
  const rpmConfig = Object.assign({}, forgeConfig.electronInstallerRedhat, rpmDefaults);

  d('executing electron-installer-redhat with options:', rpmConfig);
  await pify(installer)(rpmConfig);
  return [outPath];
};

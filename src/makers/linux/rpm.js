import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';
import configFn from '../../util/config-fn';
import isInstalled from '../../util/is-installed';

export const isSupportedOnCurrentPlatform = async () => isInstalled('electron-installer-redhat');

function rpmArch(nodeArch) {
  switch (nodeArch) {
    case 'ia32': return 'i386';
    case 'x64': return 'x86_64';
    case 'armv7l': return 'armv7hl';
    case 'arm': return 'armv6hl';
    default: return nodeArch;
  }
}

export default async ({ dir, targetArch, forgeConfig, packageJSON }) => {
  const installer = require('electron-installer-redhat');

  const arch = rpmArch(targetArch);
  const outPath = path.resolve(dir, '../make', `${packageJSON.name}-${packageJSON.version}.${arch}.rpm`);

  await ensureFile(outPath);
  const rpmDefaults = {
    arch,
    dest: path.dirname(outPath),
    src: dir,
  };
  const rpmConfig = Object.assign({}, configFn(forgeConfig.electronInstallerRedhat, targetArch), rpmDefaults);

  await pify(installer)(rpmConfig);
  return [outPath];
};

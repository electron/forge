import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';
import configFn from '../../util/config-fn';
import { checkSupportedPlatforms } from '../../util/check-supported-platforms';

export const supportedPlatforms = checkSupportedPlatforms('electron-installer-debian');

function debianArch(nodeArch) {
  switch (nodeArch) {
    case 'ia32': return 'i386';
    case 'x64': return 'amd64';
    case 'armv7l': return 'armhf';
    case 'arm': return 'armel';
    default: return nodeArch;
  }
}

export default async ({ dir, targetArch, forgeConfig, packageJSON }) => {
  const installer = require('electron-installer-debian');

  const arch = debianArch(targetArch);
  const outPath = path.resolve(dir, '../make', `${packageJSON.name}_${packageJSON.version}_${arch}.deb`);

  await ensureFile(outPath);
  const debianDefaults = {
    arch,
    dest: path.dirname(outPath),
    src: dir,
  };
  const debianConfig = Object.assign({}, configFn(forgeConfig.electronInstallerDebian, targetArch), debianDefaults);

  await pify(installer)(debianConfig);
  return [outPath];
};

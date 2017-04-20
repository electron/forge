import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';
import configFn from '../../util/config-fn';
import { checkSupportedPlatforms } from '../../util/check-supported-platforms';

export const supportedPlatforms = checkSupportedPlatforms('electron-installer-flatpak');

function flatpakArch(nodeArch) {
  switch (nodeArch) {
    case 'ia32': return 'i386';
    case 'x64': return 'x86_64';
    case 'armv7l': return 'arm';
    // arm => arm
    default: return nodeArch;
  }
}

export default async ({ dir, targetArch, forgeConfig, packageJSON }) => {
  const installer = require('electron-installer-flatpak');

  const arch = flatpakArch(targetArch);
  const outPath = path.resolve(dir, '../make', `${packageJSON.name}_${packageJSON.version}_${arch}.flatpak`);

  await ensureFile(outPath);
  const flatpakDefaults = {
    arch,
    dest: path.dirname(outPath),
    src: dir,
  };
  const flatpakConfig = Object.assign({}, configFn(forgeConfig.electronInstallerFlatpak, targetArch), flatpakDefaults);

  await pify(installer)(flatpakConfig);
  return [outPath];
};

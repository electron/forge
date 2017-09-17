import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';
import isInstalled from '../../util/is-installed';
import { linuxConfig, populateConfig } from '../../util/linux-config';

export const isSupportedOnCurrentPlatform = async () => isInstalled('electron-installer-flatpak');

export function flatpakArch(nodeArch) {
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
  const config = populateConfig({ forgeConfig, configKey: 'electronInstallerFlatpak', targetArch });
  const outPath = path.resolve(dir, '../make', `${packageJSON.name}_${packageJSON.version}_${arch}.flatpak`);

  await ensureFile(outPath);
  const flatpakConfig = linuxConfig({
    config,
    pkgArch: arch,
    dir,
    outPath,
  });

  await pify(installer)(flatpakConfig);
  return [outPath];
};

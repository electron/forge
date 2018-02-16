import fs from 'fs-extra';
import path from 'path';
import pify from 'pify';

import { ensureDirectory } from '../../util/ensure-output';
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

export default async ({ dir, targetArch, forgeConfig }) => {
  const installer = require('electron-installer-flatpak');

  const arch = flatpakArch(targetArch);
  const config = populateConfig({ forgeConfig, configKey: 'electronInstallerFlatpak', targetArch });
  const outDir = path.resolve(dir, '../make');

  await ensureDirectory(outDir);
  const flatpakConfig = linuxConfig({
    config,
    pkgArch: arch,
    dir,
    // electron-installer-flatpak uses a filename scheme with default config options that we don't
    // have access to, so we need to detect the flatpak filename after it's created.
    outPath: path.join(outDir, 'dummy.flatpak'),
  });

  await pify(installer)(flatpakConfig);

  return (await fs.readdir(outDir))
    .filter(basename => basename.endsWith('.flatpak'))
    .map(basename => path.join(outDir, basename));
};

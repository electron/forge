import path from 'path';

import { ensureFile } from '../../util/ensure-output';
import isInstalled from '../../util/is-installed';
import { linuxConfig, populateConfig } from '../../util/linux-config';

export const isSupportedOnCurrentPlatform = async () => isInstalled('electron-installer-debian');

export function debianArch(nodeArch) {
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
  const config = populateConfig({ forgeConfig, configKey: 'electronInstallerDebian', targetArch });
  const name = config.options.name || packageJSON.name;
  const versionedName = `${name}_${installer.transformVersion(packageJSON.version)}_${arch}`;
  const outPath = path.resolve(dir, '../make', `${versionedName}.deb`);

  await ensureFile(outPath);
  const debianConfig = linuxConfig({
    config,
    pkgArch: arch,
    dir,
    outPath,
  });

  await installer(debianConfig);
  return [outPath];
};

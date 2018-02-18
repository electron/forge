import path from 'path';
import pify from 'pify';

import { ensureFile } from '../../util/ensure-output';
import isInstalled from '../../util/is-installed';
import { linuxConfig, populateConfig } from '../../util/linux-config';

export const isSupportedOnCurrentPlatform = async () => isInstalled('electron-installer-redhat');

export function rpmArch(nodeArch) {
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
  const config = populateConfig({ forgeConfig, configKey: 'electronInstallerRedhat', targetArch });
  const name = config.options.name || packageJSON.name;
  const versionedName = `${name}-${packageJSON.version}.${arch}`;
  const outPath = path.resolve(dir, '../make', `${versionedName}.rpm`);

  await ensureFile(outPath);
  const rpmConfig = linuxConfig({
    config,
    pkgArch: arch,
    dir,
    outPath,
  });

  await pify(installer)(rpmConfig);
  return [outPath];
};

import path from 'path';

import { ensureDirectory } from '../../util/ensure-output';
import configFn from '../../util/config-fn';

export const isSupportedOnCurrentPlatform = async () => process.platform === 'linux';

export default async ({ dir, targetArch, forgeConfig }) => {
  const installer = require('electron-installer-snap');

  const outPath = path.resolve(dir, '../make');

  await ensureDirectory(outPath);
  const snapDefaults = {
    arch: targetArch,
    dest: outPath,
    src: dir,
  };
  const snapConfig = Object.assign({}, configFn(forgeConfig.electronInstallerSnap, targetArch), snapDefaults);

  return [await installer(snapConfig)];
};

import { createWindowsInstaller } from 'electron-winstaller';
import path from 'path';

import { ensureDirectory } from '../../util/ensure-output';

export default async (dir, appName, forgeConfig, packageJSON) => { // eslint-disable-line
  const outPath = path.resolve(dir, '../make/squirrel.windows');
  await ensureDirectory(outPath);

  const winstallerConfig = Object.assign({
    description: 'This is the default electron-forge description, you can override it in your config',
  }, forgeConfig.electronWinstallerConfig, {
    appDirectory: dir,
    outputDirectory: outPath,
  });
  await createWindowsInstaller(winstallerConfig);
};

import { createWindowsInstaller } from 'electron-winstaller';
import path from 'path';

import { ensureDirectory } from '../../util/ensure-output';

export default async (dir, appName, targetArch, forgeConfig, packageJSON) => { // eslint-disable-line
  const outPath = path.resolve(dir, `../make/squirrel.windows/${targetArch}`);
  await ensureDirectory(outPath);

  const winstallerConfig = Object.assign({}, forgeConfig.electronWinstallerConfig, {
    appDirectory: dir,
    outputDirectory: outPath,
  });
  await createWindowsInstaller(winstallerConfig);
};

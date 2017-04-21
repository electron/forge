import fs from 'fs-promise';
import path from 'path';

import { ensureDirectory } from '../../util/ensure-output';
import configFn from '../../util/config-fn';
import isInstalled from '../../util/is-installed';

export const isSupportedOnCurrentPlatform = async () => isInstalled('electron-winstaller');

export default async ({ dir, appName, targetArch, forgeConfig, packageJSON }) => {
  const { createWindowsInstaller } = require('electron-winstaller');

  const outPath = path.resolve(dir, `../make/squirrel.windows/${targetArch}`);
  await ensureDirectory(outPath);

  const winstallerConfig = Object.assign({
    name: appName,
    noMsi: true,
    exe: `${appName}.exe`,
  }, configFn(forgeConfig.electronWinstallerConfig, targetArch), {
    appDirectory: dir,
    outputDirectory: outPath,
  });

  await createWindowsInstaller(winstallerConfig);
  const artifacts = [
    path.resolve(outPath, 'RELEASES'),
    path.resolve(outPath, winstallerConfig.setupExe || `${appName}Setup.exe`),
    path.resolve(outPath, `${winstallerConfig.name}-${packageJSON.version}-full.nupkg`),
  ];
  const deltaPath = path.resolve(outPath, `${winstallerConfig.name}-${packageJSON.version}-delta.nupkg`);
  if (winstallerConfig.remoteReleases || await fs.exists(deltaPath)) {
    artifacts.push(deltaPath);
  }
  const msiPath = path.resolve(outPath, winstallerConfig.setupMsi || `${appName}Setup.msi`);
  if (!winstallerConfig.noMsi && await fs.exists(msiPath)) {
    artifacts.push(msiPath);
  }
  return artifacts;
};

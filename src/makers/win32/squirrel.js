import debug from 'debug';
import { createWindowsInstaller } from 'electron-winstaller';
import fs from 'fs-promise';
import path from 'path';

import { ensureDirectory } from '../../util/ensure-output';

const d = debug('electron-forge:make:squirrel');

export default async (dir, appName, targetArch, forgeConfig, packageJSON) => { // eslint-disable-line
  const outPath = path.resolve(dir, `../make/squirrel.windows/${targetArch}`);
  await ensureDirectory(outPath);

  const winstallerConfig = Object.assign({
    name: packageJSON.name,
    noMsi: true,
  }, forgeConfig.electronWinstallerConfig, {
    appDirectory: dir,
    outputDirectory: outPath,
  });

  d('executing electron-winstaller with options:', winstallerConfig);

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

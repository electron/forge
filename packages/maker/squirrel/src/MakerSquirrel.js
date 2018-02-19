import MakerBase from '@electron-forge/maker-base';

import fs from 'fs-extra';
import path from 'path';

export default class MakerSquirrel extends MakerBase {
  constructor() {
    super('squirel');
  }

  isSupportedOnCurrentPlatform() {
    return this.isInstalled('electron-winstaller') && !process.env.DISABLE_SQUIRREL_TEST;
  }

  async make({
    dir,
    makeDir,
    targetArch,
    packageJSON,
    appName,
    config,
  }) {
    const { createWindowsInstaller } = require('electron-winstaller');

    const outPath = path.resolve(makeDir, `squirrel.windows/${targetArch}`);
    await this.ensureDirectory(outPath);

    const winstallerConfig = Object.assign({
      name: appName,
      noMsi: true,
      exe: `${appName}.exe`,
      setupExe: `${appName}-${packageJSON.version} Setup.exe`,
    }, config, {
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
    if (winstallerConfig.remoteReleases || await fs.pathExists(deltaPath)) {
      artifacts.push(deltaPath);
    }
    const msiPath = path.resolve(outPath, winstallerConfig.setupMsi || `${appName}Setup.msi`);
    if (!winstallerConfig.noMsi && await fs.pathExists(msiPath)) {
      artifacts.push(msiPath);
    }
    return artifacts;
  }
}

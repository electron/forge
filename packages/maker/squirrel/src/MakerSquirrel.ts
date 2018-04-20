import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

import { createWindowsInstaller, Options as ElectronWinstallerOptions } from 'electron-winstaller';
import fs from 'fs-extra';
import path from 'path';

// Hacks to fix make appDirectory optional
export type Optional<T> = {
  [K in keyof T]?: T[K];
}

export default class MakerSquirrel extends MakerBase<Optional<ElectronWinstallerOptions>> {
  name = 'squirrel';
  defaultPlatforms: ForgePlatform[] = ['win32'];

  isSupportedOnCurrentPlatform() {
    return this.isInstalled('electron-winstaller') && !process.env.DISABLE_SQUIRREL_TEST;
  }

  async make({
    dir,
    makeDir,
    targetArch,
    packageJSON,
    appName,
  }: MakerOptions) {
    const outPath = path.resolve(makeDir, `squirrel.windows/${targetArch}`);
    await this.ensureDirectory(outPath);

    const winstallerConfig = Object.assign({
      name: packageJSON.name,
      title: appName,
      noMsi: true,
      exe: `${appName}.exe`,
      setupExe: `${appName}-${packageJSON.version} Setup.exe`,
    }, this.config, {
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

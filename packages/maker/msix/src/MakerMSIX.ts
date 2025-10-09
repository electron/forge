import { getNameFromAuthor } from '@electron-forge/core-utils';
import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import { packageMSIX } from 'electron-windows-msix';

import { MakerMSIXConfig } from './Config';
import { toMsixArch } from './util/arch';

/**
 * Creates an MSIX package for your Electron app.
 * @experimental
 */
export default class MakerMSIX extends MakerBase<MakerMSIXConfig> {
  name = 'msix';
  defaultPlatforms: ForgePlatform[] = ['win32'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'win32';
  }

  async make({
    dir,
    makeDir,
    targetArch,
    packageJSON,
    appName,
  }: MakerOptions): Promise<string[]> {
    const configManifestVariables = this.config.manifestVariables;
    const packageOptions = this.config;
    delete packageOptions.manifestVariables;

    const result = await packageMSIX({
      manifestVariables: {
        packageDescription: packageJSON.description,
        appExecutable: `${appName}.exe`,
        packageVersion: packageJSON.version,
        publisher: getNameFromAuthor(packageJSON.author),
        packageIdentity: appName,
        targetArch: toMsixArch(targetArch),
        ...configManifestVariables,
      },
      ...packageOptions,
      appDir: dir,
      outputDir: makeDir,
    });

    return [result.msixPackage];
  }
}

export { MakerMSIX, MakerMSIXConfig };

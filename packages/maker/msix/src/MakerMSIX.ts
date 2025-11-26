import os from 'node:os';
import path from 'node:path';

import { getNameFromAuthor } from '@electron-forge/core-utils';
import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';
import { packageMSIX } from 'electron-windows-msix';
import fs from 'fs-extra';

import { MakerMSIXConfig } from './Config.js';
import { toMsixArch } from './util/arch.js';

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
    const { manifestVariables, ...packageOptions } = this.config;

    // Do all the scratch work in a temporary folder
    const tmpFolder = await fs.mkdtemp(
      path.resolve(os.tmpdir(), 'msix-maker-'),
    );

    try {
      const result = await packageMSIX({
        ...packageOptions,
        manifestVariables: {
          packageDescription: packageJSON.description,
          appExecutable: `${appName}.exe`,
          packageVersion: packageJSON.version,
          publisher: getNameFromAuthor(packageJSON.author),
          packageIdentity: appName,
          targetArch: toMsixArch(targetArch),
          ...manifestVariables,
        },
        appDir: dir,
        outputDir: tmpFolder,
      });

      const outputPath = path.resolve(
        makeDir,
        'msix',
        targetArch,
        `${appName}.msix`,
      );
      await fs.mkdirp(path.dirname(outputPath));
      await fs.move(result.msixPackage, outputPath);
      return [outputPath];
    } finally {
      fs.remove(tmpFolder);
    }
  }
}

export { MakerMSIX, MakerMSIXConfig };

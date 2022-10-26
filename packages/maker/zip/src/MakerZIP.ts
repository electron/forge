import path from 'path';
import { promisify } from 'util';

import { EmptyConfig, MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgePlatform } from '@electron-forge/shared-types';

export type MakerZIPConfig = EmptyConfig;

export default class MakerZIP extends MakerBase<MakerZIPConfig> {
  name = 'zip';

  defaultPlatforms: ForgePlatform[] = ['darwin', 'mas', 'win32', 'linux'];

  isSupportedOnCurrentPlatform(): boolean {
    return true;
  }

  async make({ dir, makeDir, appName, packageJSON, targetArch, targetPlatform }: MakerOptions): Promise<string[]> {
    const { zip } = require('cross-zip');

    const zipDir = ['darwin', 'mas'].includes(targetPlatform) ? path.resolve(dir, `${appName}.app`) : dir;

    const zipPath = path.resolve(makeDir, 'zip', targetPlatform, targetArch, `${path.basename(dir)}-${packageJSON.version}.zip`);

    await this.ensureFile(zipPath);
    await promisify(zip)(zipDir, zipPath);

    return [zipPath];
  }
}

export { MakerZIP };

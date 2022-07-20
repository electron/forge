import InstallerDarwin, { InstallerOptions } from '@electron-forge/installer-darwin';

import { spawn } from '@malept/cross-spawn-promise';
import fs from 'fs-extra';
import path from 'path';

import { getMountedImages, mountImage, unmountImage } from './util/hdiutil';

export default class InstallerDMG extends InstallerDarwin {
  name = 'dmg';

  async install({ filePath, installSpinner }: InstallerOptions): Promise<void> {
    const mounts = await getMountedImages();
    let targetMount = mounts.find((mount) => mount.imagePath === filePath);

    if (!targetMount) {
      targetMount = await mountImage(filePath);
    }

    try {
      const volumePath = path.resolve('/Volumes', targetMount.mountPath);
      const appName = (await fs.readdir(volumePath)).find((file) => file.endsWith('.app'));
      if (!appName) {
        throw new Error('Failed to find .app file in DMG');
      }
      const appPath = path.resolve(volumePath, appName);
      const targetApplicationPath = `/Applications/${path.basename(appPath)}`;

      await this.moveApp(appPath, targetApplicationPath, installSpinner, true);

      await spawn('open', ['-R', targetApplicationPath], { detached: true });
    } finally {
      await unmountImage(targetMount);
    }
  }
}

export { InstallerOptions };

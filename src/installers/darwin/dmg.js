import { spawn } from 'child_process';
import fs from 'fs-promise';
import path from 'path';

import { getMountedImages, mountImage, unmountImage } from '../../util/hdiutil';
import moveApp from '../../util/move-app';

export default async (filePath, installSpinner) => {
  const mounts = await getMountedImages();
  let targetMount = mounts.find(mount => mount.imagePath === filePath);

  if (!targetMount) {
    targetMount = await mountImage(filePath);
  }

  try {
    const volumePath = path.resolve('/Volumes', targetMount.mountPath);
    const appName = (await fs.readdir(volumePath)).find(file => file.endsWith('.app'));
    if (!appName) {
      // eslint-disable-next-line no-throw-literal
      throw 'Failed to find .app file in DMG';
    }
    const appPath = path.resolve(volumePath, appName);
    const targetApplicationPath = `/Applications/${path.basename(appPath)}`;

    await moveApp(appPath, targetApplicationPath, installSpinner, true);

    spawn('open', ['-R', targetApplicationPath], { detached: true });
  } finally {
    await unmountImage(targetMount);
  }
};

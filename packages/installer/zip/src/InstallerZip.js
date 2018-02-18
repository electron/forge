import InstallerDarwin from '@electron-forge/installer-darwin';

import spawnPromise from 'cross-spawn-promise';
import fs from 'fs-extra';
import path from 'path';

export default class InstallerZip extends InstallerDarwin {
  constructor() {
    super('zip');
  }

  async install({
    filePath,
    installSpinner,
  }) {
    await spawnPromise('unzip', ['-q', '-o', path.basename(filePath)], {
      cwd: path.dirname(filePath),
    });

    const appPath = (await fs.readdir(path.dirname(filePath))).filter(file => file.endsWith('.app'))
      .map(file => path.resolve(path.dirname(filePath), file))
      .sort((fA, fB) => fs.statSync(fA).ctime.getTime() - fs.statSync(fB).ctime.getTime())[0];

    const targetApplicationPath = `/Applications/${path.basename(appPath)}`;

    await this.moveApp(appPath, targetApplicationPath, installSpinner);

    await spawnPromise('open', ['-R', targetApplicationPath], { detached: true });
  }
}

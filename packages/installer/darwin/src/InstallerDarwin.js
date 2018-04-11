import InstallerBase from '@electron-forge/installer-base';

import fs from 'fs-extra';
import path from 'path';
import pify from 'pify';
import sudo from 'sudo-prompt';
import { exec } from 'child_process';

export default class InstallerDarwin extends InstallerBase {
  async moveApp(appPath, targetApplicationPath, spinner, copyInstead = false) {
    let writeAccess = true;
    try {
      await fs.access('/Applications', fs.W_OK);
    } catch (err) {
      writeAccess = false;
    }

    if (await fs.pathExists(targetApplicationPath)) {
      spinner.fail();
      throw `The application "${path.basename(targetApplicationPath)}" appears to already exist in /Applications.`;
    }

    const moveCommand = `${copyInstead ? 'cp -r' : 'mv'} "${appPath}" "${targetApplicationPath}"`;
    if (writeAccess) {
      await pify(exec)(moveCommand);
    } else {
      await pify(sudo.exec)(moveCommand, {
        name: 'Electron Forge',
      });
    }
  }
}

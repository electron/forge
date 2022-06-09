import { OraImpl } from '@electron-forge/async-ora';
import InstallerBase, { InstallerOptions } from '@electron-forge/installer-base';

import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
import sudo from 'sudo-prompt';
import { exec } from 'child_process';

export { InstallerOptions };

export default abstract class InstallerDarwin extends InstallerBase {
  async moveApp(appPath: string, targetApplicationPath: string, spinner: OraImpl, copyInstead = false): Promise<void> {
    let writeAccess = true;
    try {
      await fs.access('/Applications', fs.constants.W_OK);
    } catch (err) {
      writeAccess = false;
    }

    if (await fs.pathExists(targetApplicationPath)) {
      spinner.fail();
      throw new Error(`The application "${path.basename(targetApplicationPath)}" appears to already exist in /Applications.`);
    }

    const moveCommand = `${copyInstead ? 'cp -r' : 'mv'} "${appPath}" "${targetApplicationPath}"`;
    if (writeAccess) {
      await promisify(exec)(moveCommand);
    } else {
      await (promisify(sudo.exec) as (cmd: string, opts: unknown) => Promise<unknown>)(moveCommand, {
        name: 'Electron Forge',
      });
    }
  }
}

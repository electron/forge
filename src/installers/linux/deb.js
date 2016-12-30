import pify from 'pify';
import sudo from 'sudo-prompt';

import linuxInstaller from '../../util/linux-installer';

export default async (filePath) => {
  linuxInstaller('Debian', 'gdebi', pify(sudo.exec)(`gdebi -n ${filePath}`, {
    name: 'Electron Forge',
  }));
};

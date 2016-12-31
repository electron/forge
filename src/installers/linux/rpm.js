import pify from 'pify';
import sudo from 'sudo-prompt';

import linuxInstaller from '../../util/linux-installer';

export default async (filePath) => {
  linuxInstaller('RPM', 'dnf', pify(sudo.exec)(`dnf --assumeyes --nogpgcheck install ${filePath}`, {
    name: 'Electron Forge',
  }));
};

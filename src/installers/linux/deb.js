import { sudo } from '../../util/linux-installer';

export default async (filePath) => {
  sudo('Debian', 'gdebi', `-n ${filePath}`);
};

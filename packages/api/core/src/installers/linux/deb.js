import { sudo } from '../../util/linux-installer';

export default async (filePath) => {
  await sudo('Debian', 'gdebi', `-n ${filePath}`);
};

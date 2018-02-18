import { sudo } from '../../util/linux-installer';

export default async (filePath) => {
  await sudo('RPM', 'dnf', `--assumeyes --nogpgcheck install ${filePath}`);
};

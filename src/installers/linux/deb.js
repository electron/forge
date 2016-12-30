import pify from 'pify';
import sudo from 'sudo-prompt';

export default async (filePath) => {
  await pify(sudo.exec)(`gdebi -n ${filePath}`, {
    name: 'Electron Forge',
  });
};

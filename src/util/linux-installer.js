import { spawnSync } from 'child_process';
import pify from 'pify';
import sudoPrompt from 'sudo-prompt';

const which = async (type, prog, promise) => {
  if (spawnSync('which', [prog]).status === 0) {
    await promise;
  } else {
    throw new Error(`${prog} is required to install ${type} packages`);
  }
};

export const sudo = (type, prog, args) =>
  which(type, prog, pify(sudoPrompt.exec)(`${prog} ${args}`, { name: 'Electron Forge' }));

export default which;

import { spawnSync } from 'node:child_process';
import { promisify } from 'node:util';

import sudoPrompt from 'sudo-prompt';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const which = async (type: string, prog: string, promise: () => Promise<any>): Promise<void> => {
  if (spawnSync('which', [prog]).status === 0) {
    await promise();
  } else {
    throw new Error(`${prog} is required to install ${type} packages`);
  }
};

export const sudo = (type: string, prog: string, args: string): Promise<void> =>
  which(type, prog, () => promisify(sudoPrompt.exec)(`${prog} ${args}`, { name: 'Electron Forge' }));

export default which;

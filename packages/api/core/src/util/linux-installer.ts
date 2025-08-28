import { spawnSync } from 'node:child_process';
import { promisify } from 'node:util';

import sudoPrompt from '@vscode/sudo-prompt';

const which = async (
  type: string,
  prog: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  promise: () => Promise<any>,
): Promise<void> => {
  if (spawnSync('which', [prog]).status === 0) {
    await promise();
  } else {
    throw new Error(`${prog} is required to install ${type} packages`);
  }
};

export const sudo = (type: string, prog: string, args: string): Promise<void> =>
  which(type, prog, () =>
    promisify(sudoPrompt.exec)(`${prog} ${args}`, { name: 'Electron Forge' }),
  );

export default which;

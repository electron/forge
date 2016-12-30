import { spawnSync } from 'child_process';

export default async (type, prog, promise) => {
  if (spawnSync('which', [prog]).status === 0) {
    await promise;
  } else {
    throw new Error(`${prog} is required to install ${type} packages`);
  }
};

import yarnOrNpm from 'yarn-or-npm';
import { spawnPromise } from 'spawn-rx';

const safeYarnOrNpm = () => {
  const system = yarnOrNpm();
  switch (process.env.NODE_INSTALLER) {
    case 'yarn':
    case 'npm':
      return process.env.NODE_INSTALLER;
    default:
      return system;
  }
};

export default safeYarnOrNpm;

export const yarnOrNpmSpawn = (...args) => spawnPromise(safeYarnOrNpm(), ...args);

export const hasYarn = () => safeYarnOrNpm() === 'yarn';

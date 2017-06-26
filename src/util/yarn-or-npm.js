import { spawnPromise } from 'spawn-rx';
import logSymbols from 'log-symbols';
import yarnOrNpm from 'yarn-or-npm';

const safeYarnOrNpm = () => {
  const system = yarnOrNpm();
  switch (process.env.NODE_INSTALLER) {
    case 'yarn':
    case 'npm':
      return process.env.NODE_INSTALLER;
    case undefined:
      return system;
    default:
      console.warn(`${logSymbols.warning} Unknown NODE_INSTALLER, using detected installer ${system}`.yellow);
      return system;
  }
};

export default safeYarnOrNpm;

export const yarnOrNpmSpawn = (...args) => spawnPromise(safeYarnOrNpm(), ...args);

export const hasYarn = () => safeYarnOrNpm() === 'yarn';

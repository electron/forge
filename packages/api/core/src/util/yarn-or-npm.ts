import spawnPromise from 'cross-spawn-promise';
import logSymbols from 'log-symbols';
import yarnOrNpm from 'yarn-or-npm';

const safeYarnOrNpm = () => {
  const system = yarnOrNpm();
  switch (process.env.NODE_INSTALLER) {
    case 'yarn':
    case 'npm':
      return process.env.NODE_INSTALLER;
    default:
      if (process.env.NODE_INSTALLER) {
        console.warn(`${logSymbols.warning} Unknown NODE_INSTALLER, using detected installer ${system}`.yellow);
      }
      return system;
  }
};

export default safeYarnOrNpm;

export const yarnOrNpmSpawn = (args?: string[], opts?: any) => spawnPromise(safeYarnOrNpm(), args, opts);

export const hasYarn = () => safeYarnOrNpm() === 'yarn';

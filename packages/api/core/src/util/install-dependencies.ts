import debug from 'debug';
import { yarnOrNpmSpawn, hasYarn } from './yarn-or-npm';

const d = debug('electron-forge:dependency-installer');

export default async (
  dir: string,
  deps: string[],
  areDev = false,
  exact = false
) => {
  d('installing', JSON.stringify(deps), 'in:', dir, `dev=${areDev},exact=${exact},withYarn=${hasYarn()}`);
  if (deps.length === 0) {
    d('nothing to install, stopping immediately');
    return Promise.resolve();
  }
  let cmd = ['install'].concat(deps);
  if (hasYarn()) {
    cmd = ['add'].concat(deps);
    if (areDev) cmd.push('--dev');
    if (exact) cmd.push('--exact');
  } else {
    if (exact) cmd.push('--save-exact');
    if (areDev) cmd.push('--save-dev');
    if (!areDev) cmd.push('--save');
  }
  d('executing', JSON.stringify(cmd), 'in:', dir);
  try {
    await yarnOrNpmSpawn(cmd, {
      cwd: dir,
      stdio: 'pipe',
    });
  } catch (err) {
    throw new Error(`Failed to install modules: ${JSON.stringify(deps)}\n\nWith output: ${err.message}`);
  }
};

import { spawn as yarnOrNPMSpawn, hasYarn } from 'yarn-or-npm';

import config from './config';

export default (dir, deps, areDev = false, exact = false) => {
  if (deps.length === 0) return Promise.resolve();
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
  return new Promise((resolve, reject) => {
    const child = yarnOrNPMSpawn(cmd, {
      cwd: dir,
      stdio: config.get('verbose') ? 'inherit' : 'ignore',
    });
    child.on('exit', (code) => {
      if (code !== 0) return reject(code);
      resolve();
    });
  });
};

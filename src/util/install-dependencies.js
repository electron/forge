import { spawn as yarnOrNPMSpawn, hasYarn } from 'yarn-or-npm';

import config from './config'

export default (dir, deps, areDev=false) => {
  let cmd = ['install'].concat(deps).concat([areDev ? '--save-dev' : '--save']);
  if (hasYarn()) {
    cmd = ['add'].concat(deps);
    if (areDev) cmd.push('--dev');
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
}

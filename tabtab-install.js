const fs = require('fs');
const path = require('path');
const { findActualExecutable, spawnPromise } = require('spawn-rx');

const tabtabPath = path.resolve(__dirname, './node_modules/.bin/tabtab');

if (!fs.existsSync(path.resolve(__dirname, 'src'))) {
  spawnPromise(findActualExecutable(tabtabPath).cmd, ['install', '--auto'], {
    stdio: 'inherit',
  }).catch(err => console.error('Failed to install tab completion:', err));
}

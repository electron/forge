const fs = require('fs');
const path = require('path');

/*
 * Adds a shim to fix Windows symlinking with create-electron-app.
 * Should run on Windows only.
 * More details: https://github.com/boltpkg/bolt/issues/207
 */
function createShim(shimPath) {
  fs.mkdirSync(path.dirname(shimPath), { recursive: true });
  fs.writeFileSync(shimPath, '');
}

async function main() {
  const srcRoot = path.resolve(__dirname, '..');
  const cli = path.resolve(srcRoot, 'packages', 'api', 'cli', 'dist', 'electron-forge.js');
  const cea = path.resolve(srcRoot, 'packages', 'external', 'create-electron-app', 'dist', 'index.js');
  createShim(cli);
  createShim(cea);
}

if (process.platform === 'win32') {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

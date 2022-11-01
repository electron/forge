const fs = require('fs');
const path = require('path');

/*
 * Adds a shim to fix Windows symlinking with create-electron-app.
 * Should run on Windows only.
 * More details: https://github.com/boltpkg/bolt/issues/207
 */
function createShim(dir, shimPath) {
  const cwd = process.cwd();
  fs.mkdirSync(path.resolve(cwd, dir), { recursive: true });
  fs.writeFileSync(path.resolve(cwd, shimPath), '');
}

async function main() {
  const cli = path.resolve('packages', 'api', 'cli', 'dist');
  const cea = path.resolve('packages', 'external', 'create-electron-app', 'dist');
  createShim(cli, path.resolve(cli, 'electron-forge.js'));
  createShim(cea, path.resolve(cea, 'index.js'));
}

if (process.platform === 'win32') {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

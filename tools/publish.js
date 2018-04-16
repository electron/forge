require('colors');
const childProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const spawnPromise = require('cross-spawn-promise');

const BASE_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.resolve(BASE_DIR, 'packages');

(async () => {
  // Check clean working dir
  if (childProcess.execSync('git status -s', {
    cwd: BASE_DIR,
  }).toString() !== '') {
    throw 'Your working directory is not clean, please ensure you have a clean working directory before publishing'.red;
  }

  console.info('Building all packages');
  await spawnPromise('bolt', ['build'], {
    cwd: BASE_DIR,
  });

  console.info('Publishing all packages');

  const dirsToPublish = [];

  for (const subDir of await fs.readdir(PACKAGES_DIR)) {
    for (const packageDir of await fs.readdir(path.resolve(PACKAGES_DIR, subDir))) {
      dirsToPublish.push(path.resolve(PACKAGES_DIR, subDir, packageDir));
    }
  }

  for (const dir of dirsToPublish) {
    const { name, version } = await fs.readJson(path.resolve(dir, 'package.json'));
    const isBeta = version.includes('beta');
    console.info(`  * Publishing: ${`${name}@${version}`.cyan} (beta=${isBeta ? 'true'.green : 'red'.red})`);
    childProcess.execSync(`npm publish --access=public${isBeta ? ' --tag=beta' : ''}`, {
      cwd: dir,
    });
  }
})().catch(console.error);

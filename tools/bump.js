require('colors');
const childProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const semver = require('semver');

const BASE_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.resolve(BASE_DIR, 'packages');
const ELECTRON_FORGE_PREFIX = '@electron-forge/';

(async () => {
  // Check clean working dir
  if (childProcess.execSync('git status -s', {
    cwd: BASE_DIR,
  }).toString() !== '') {
    throw 'Your working directory is not clean, please ensure you have a clean working directory before version bumping'.red;
  }

  const version = process.argv[2];
  if (!version) {
    throw `Must provide a version in argv[1]`.red;
  }
  if (!semver.valid(version)) {
    throw `Must provide a valid semver version in argv[1].  Got ${version}`.red;
  }
  console.info(`Setting version of all dependencies: ${version.cyan}`)
  const packages = [];

  let lastVersion;
  const dirsToUpdate = [BASE_DIR];

  for (const subDir of await fs.readdir(PACKAGES_DIR)) {
    for (const packageDir of await fs.readdir(path.resolve(PACKAGES_DIR, subDir))) {
      dirsToUpdate.push(path.resolve(PACKAGES_DIR, subDir, packageDir));
    }
  }

  for (const dir of dirsToUpdate) {
    const pjPath = path.resolve(dir, 'package.json');
    const existingPJ = await fs.readJson(pjPath);
    existingPJ.version = version;
    for (const type of ['dependencies', 'devDependencies', 'optionalDependencies']) {
      for (const depKey in existingPJ[type]) {
        if (depKey.startsWith(ELECTRON_FORGE_PREFIX)) {
          existingPJ[type][depKey] = version;
        }
      }
    }
    await fs.writeJson(pjPath, existingPJ, {
      spaces: 2,
    });
    childProcess.execSync(`git add "${path.relative(BASE_DIR, pjPath)}"`, {
      cwd: BASE_DIR,
    });
    lastVersion = existingPJ.version;
  }

  childProcess.execSync(`git commit -m "Version Bump: ${version}"`, {
    cwd: BASE_DIR,
  });
  childProcess.execSync(`git tag v${version}`, {
    cwd: BASE_DIR,
  });
  childProcess.execSync(`node_modules/.bin/changelog --tag=v${lastVersion}`, {
    cwd: BASE_DIR,
  });
  require('../ci/fix-changelog');
})().catch(console.error);
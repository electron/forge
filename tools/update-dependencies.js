#!/usr/bin/env node

const { spawn } = require('@malept/cross-spawn-promise');
const glob = require('fast-glob');
const { satisfies } = require('semver');

const DO_NOT_UPGRADE = [
  '@types/node-fetch', // No longer needed when node-fetch is upgraded to >= 3.0.0
  '@typescript-eslint/eslint-plugin', // special case
  'chalk', // Requires ESM
  'commander', // TODO: convert to yargs
  'find-up', // Requires ESM
  'log-symbols', // Requires ESM
  'node-fetch', // Requires ESM
  'ora', // Requires ESM
  'username', // Requires ESM
];

/**
 * Spawn, but pass through stdio by default.
 */
async function spawnPassthrough(cmd, args, options) {
  await spawn(cmd, args, { stdio: 'inherit', ...options });
}

async function git(...args) {
  await spawnPassthrough('git', args);
}

async function yarn(...args) {
  await spawnPassthrough('yarn', args);
}

const packageJSON = require(__dirname + '/../package.json');

class Package {
  constructor(name, currentVersion, wantedVersion, latestVersion, type) {
    this.name = name;
    this.currentVersion = currentVersion;
    this.wantedVersion = wantedVersion;
    this.latestVersion = latestVersion;
    this.type = type;
  }

  get commitType() {
    switch (this.type) {
      case 'dependencies':
      case 'optionalDependencies':
        return 'deps';
      case 'devDependencies':
        return 'deps-dev';
      default:
        return 'deps-unknown';
    }
  }

  get commitVersion() {
    if (this.isMajorVersionBump()) {
      return `^${this.latestVersion}`;
    } else if (this.isMinorVersionBump()) {
      return `~${this.latestVersion}`;
    } else {
      return this.latestVersion;
    }
  }

  get minorVersionLocked() {
    return packageJSON[this.type][this.name].startsWith('~');
  }

  isMajorVersionBump() {
    return !satisfies(this.latestVersion, `^${this.wantedVersion}`);
  }

  isMinorVersionBump() {
    return this.minorVersionLocked && !satisfies(this.latestVersion, `~${this.wantedVersion}`);
  }

  async smoketestAndCommit(packageName = null) {
    const packageJSONs = await glob('packages/*/*/package.json');
    await yarn('lint');
    await yarn('build');
    await git('add', 'package.json', 'yarn.lock', ...packageJSONs);
    await git('commit', '-m', `build(${this.commitType}): upgrade ${packageName || this.name} to ${this.commitVersion}`);
  }

  async upgrade() {
    if (this.isMajorVersionBump() || this.isMinorVersionBump()) {
      await this.yarn_upgrade_and_update_packageJSON();
    } else {
      await this.yarn_upgrade_in_yarn_lock();
    }
  }

  async yarn_upgrade_and_update_packageJSON() {
    console.log(`Upgrading ${this.name} from ${this.wantedVersion} to ^${this.latestVersion} (and updating package.json)...`);
    await yarn('upgrade', `${this.name}@^${this.latestVersion}`);
  }

  async yarn_upgrade_in_yarn_lock() {
    console.log(`Upgrading ${this.name} from ${this.currentVersion} to ${this.latestVersion} in yarn.lock...`);
    await yarn('upgrade', this.name);
  }
}

async function main() {
  const onlyModules = [];
  if (process.argv.length > 2) {
    onlyModules.push(...process.argv.slice(2));
  }
  try {
    await spawn('yarn', ['outdated', '--json']);
    console.log('No packages to update.');
  } catch (error) {
    const table = JSON.parse(error.stdout.split('\n')[1]);
    for (const [packageName, currentVersion, wantedVersion, latestVersion, packageType /*, _url */] of table.data.body) {
      if (DO_NOT_UPGRADE.includes(packageName)) {
        console.log(`Skipping "${packageName} from update as it is in the denylist`);
        continue;
      }
      if (onlyModules.length > 0 && !onlyModules.includes(packageName)) {
        console.log(`Skipping "${packageName}" from update as it was not specified on the command line`);
        continue;
      }
      let commitPackageName = null;
      const nodePackage = new Package(packageName, currentVersion, wantedVersion, latestVersion, packageType);
      await nodePackage.upgrade();

      if (packageName === '@typescript-eslint/parser') {
        const eslintPlugin = new Package('@typescript-eslint/eslint-plugin', currentVersion, wantedVersion, latestVersion, packageType);
        await eslintPlugin.upgrade();
        commitPackageName = '@typescript-eslint/{parser,eslint-plugin}';
      }

      await nodePackage.smoketestAndCommit(commitPackageName);
    }
  }

  if (onlyModules.length == 0) {
    console.log(`Upgrading transitive dependencies in yarn.lock...`);
    await yarn('upgrade');
    await git('add', 'yarn.lock');
    await git('commit', '-m', `build(deps): upgrade transitive dependencies`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!node_modules/.bin/ts-node

import chalk from 'chalk';
import * as fs from 'fs-extra';
import path from 'path';
import { spawn } from '@malept/cross-spawn-promise';
import * as semver from 'semver';

const BASE_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.resolve(BASE_DIR, 'packages');
const ELECTRON_FORGE_PREFIX = '@electron-forge/';

async function run(command: string, args: string[]): Promise<string> {
  return spawn(command, args, { cwd: BASE_DIR });
}

async function git(...args: string[]): Promise<string> {
  return run('git', args);
}

async function checkCleanWorkingDir(): Promise<void> {
  if ((await git('status', '--short')) !== '') {
    throw chalk.red('Your working directory is not clean, please ensure you have a clean working directory before version bumping');
  }
}

async function updateChangelog(lastVersion: string, version: string): Promise<void> {
  await run('yarn', ['changelog', `--tag=v${lastVersion}..v${version}`, '--exclude=build,chore,ci,docs,refactor,style,test']);

  require('../ci/fix-changelog'); // eslint-disable-line global-require

  await git('add', 'CHANGELOG.md');
  await git('commit', '-m', `Update CHANGELOG.md for ${version}`);
}

async function main(): Promise<void> {
  await checkCleanWorkingDir();

  const version = process.argv[2];
  if (!version) {
    throw chalk.red('Must provide a version in argv[2]');
  }
  if (!semver.valid(version)) {
    throw chalk.red(`Must provide a valid semver version in argv[2].  Got ${version}`);
  }

  console.info(`Setting version of all dependencies: ${chalk.cyan(version)}`);

  const { version: lastVersion } = await fs.readJson(path.join(BASE_DIR, 'package.json'));
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
    await git('add', path.relative(BASE_DIR, pjPath));
  }

  await git('commit', '-m', `Release ${version}`);
  await git('tag', `v${version}`, '-m', `v${version}`);

  await updateChangelog(lastVersion, version);

  // re-tag to include the changelog
  await git('tag', '--force', `v${version}`, '-m', `v${version}`);
}

main().catch(console.error);

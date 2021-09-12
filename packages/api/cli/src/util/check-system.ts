import { exec } from 'child_process';
import debug from 'debug';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import semver from 'semver';

import { utils as forgeUtils } from '@electron-forge/core';
import { OraImpl } from '@electron-forge/async-ora';

const d = debug('electron-forge:check-system');

async function checkGitExists() {
  return new Promise<boolean>((resolve) => {
    exec('git --version', (err) => resolve(!err));
  });
}

async function checkNodeVersion(ora: OraImpl) {
  const { engines } = await fs.readJson(path.resolve(__dirname, '..', '..', 'package.json'));
  const versionSatisified = semver.satisfies(process.versions.node, engines.node);

  if (!versionSatisified) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ora.warn!(`You are running Node.js version ${process.versions.node}, but Electron Forge requires Node.js ${engines.node}.`);
  }

  return versionSatisified;
}

const NPM_WHITELISTED_VERSIONS = {
  all: '^3.0.0 || ^4.0.0 || ~5.1.0 || ~5.2.0 || >= 5.4.2',
  darwin: '>= 5.4.0',
  linux: '>= 5.4.0',
};
const YARN_WHITELISTED_VERSIONS = {
  all: '0.23.3 || 0.24.6 || >= 1.0.0',
  darwin: '0.27.5',
  linux: '0.27.5',
};

export function validPackageManagerVersion(packageManager: string, version: string, whitelistedVersions: string, ora: OraImpl): boolean {
  try {
    return semver.satisfies(version, whitelistedVersions);
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ora.warn!(`Could not check ${packageManager} version "${version}", assuming incompatible`);
    d(`Exception while checking version: ${e}`);
    return false;
  }
}

function warnIfPackageManagerIsntAKnownGoodVersion(packageManager: string, version: string, whitelistedVersions: { [key: string]: string }, ora: OraImpl) {
  const osVersions = whitelistedVersions[process.platform];
  const versions = osVersions ? `${whitelistedVersions.all} || ${osVersions}` : whitelistedVersions.all;
  const versionString = version.toString();
  if (!validPackageManagerVersion(packageManager, versionString, versions, ora)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    ora.warn!(`You are using ${packageManager}, but not a known good version.
The known versions that work with Electron Forge are: ${versions}`);
  }
}

async function checkPackageManagerVersion(ora: OraImpl) {
  const version = await forgeUtils.yarnOrNpmSpawn(['--version']);
  const versionString = version.toString();
  if (forgeUtils.hasYarn()) {
    warnIfPackageManagerIsntAKnownGoodVersion('Yarn', versionString, YARN_WHITELISTED_VERSIONS, ora);
  } else {
    warnIfPackageManagerIsntAKnownGoodVersion('NPM', versionString, NPM_WHITELISTED_VERSIONS, ora);
  }

  return true;
}

/**
 * Some people know their system is OK and don't appreciate the 800ms lag in
 * start up that these checks (in particular the package manager check) costs.
 *
 * Simply creating this flag file in your home directory will skip these checks
 * and shave ~800ms off your forge start time.
 *
 * This is specifically not documented or everyone would make it.
 */
const SKIP_SYSTEM_CHECK = path.resolve(os.homedir(), '.skip-forge-system-check');

export default async function checkSystem(ora: OraImpl): Promise<boolean> {
  if (!(await fs.pathExists(SKIP_SYSTEM_CHECK))) {
    d('checking system, create ~/.skip-forge-system-check to stop doing this');
    return (await Promise.all([checkGitExists(), checkNodeVersion(ora), checkPackageManagerVersion(ora)])).every((check) => check);
  }
  d('skipping system check');
  return true;
}

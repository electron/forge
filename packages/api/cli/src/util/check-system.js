import { exec } from 'child_process';
import debug from 'debug';
import semver from 'semver';

import { hasYarn, yarnOrNpmSpawn } from '@electron-forge/core/dist/util/yarn-or-npm';

const d = debug('electron-forge:check-system');

async function checkGitExists() {
  return new Promise((resolve) => {
    exec('git --version', (err) => {
      if (err) return resolve(false);
      resolve(true);
    });
  });
}

async function checkNodeVersion() {
  return Promise.resolve(semver.gt(process.versions.node, '6.0.0'));
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

export function validPackageManagerVersion(packageManager, version, whitelistedVersions, ora) {
  try {
    return semver.satisfies(version, whitelistedVersions);
  } catch (e) {
    ora.warn(`Could not check ${packageManager} version "${version}", assuming incompatible`);
    d(`Exception while checking version: ${e}`);
    return false;
  }
}

function warnIfPackageManagerIsntAKnownGoodVersion(packageManager, version, whitelistedVersions, ora) {
  const osVersions = whitelistedVersions[process.platform];
  const versions = osVersions ? `${whitelistedVersions.all} || ${osVersions}` : whitelistedVersions.all;
  const versionString = version.toString();
  if (!validPackageManagerVersion(packageManager, versionString, versions, ora)) {
    ora.warn(
      `You are using ${packageManager}, but not a known good version.\n` +
      `The known versions that work with Electron Forge are: ${versions}`
    );
  }
}

async function checkPackageManagerVersion(ora) {
  return yarnOrNpmSpawn(['--version'])
    .then((version) => {
      if (hasYarn()) {
        warnIfPackageManagerIsntAKnownGoodVersion('Yarn', version, YARN_WHITELISTED_VERSIONS, ora);
      } else {
        warnIfPackageManagerIsntAKnownGoodVersion('NPM', version, NPM_WHITELISTED_VERSIONS, ora);
      }

      return true;
    });
}

export default async function (ora) {
  return (await Promise.all([checkGitExists(ora), checkNodeVersion(ora), checkPackageManagerVersion(ora)]))
    .every(check => check);
}

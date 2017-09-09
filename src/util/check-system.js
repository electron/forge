import { exec } from 'child_process';
import semver from 'semver';

import { hasYarn, yarnOrNpmSpawn } from './yarn-or-npm';

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
  all: '^3.0.0 || ^4.0.0 || ~5.1.0 || ~5.2.0 || >= 5.4.0',
};
const YARN_WHITELISTED_VERSIONS = {
  all: '0.23.3 || 0.24.6 || >= 1.0.0',
  darwin: '0.27.5',
  linux: '0.27.5',
};

function warnIfPackageManagerIsntAKnownGoodVersion(packageManager, version, whitelistedVersions, ora) {
  const osVersions = whitelistedVersions[process.platform];
  const versions = osVersions ? `${whitelistedVersions.all} || ${osVersions}` : whitelistedVersions.all;
  if (!semver.satisfies(version, versions)) {
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

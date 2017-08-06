import { exec } from 'child_process';
import logSymbols from 'log-symbols';
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

const NPM_WHITELISTED_VERSIONS = '^3.0.0 || ^4.0.0 || ~5.1.0 || ~5.2.0 || >= 5.4.0';
const YARN_WHITELISTED_VERSIONS = '0.23.3 || 0.24.6';

function warnIfPackageManagerIsntAKnownGoodVersion(packageManager, version, whitelistedVersions) {
  if (!semver.satisfies(version, whitelistedVersions)) {
    console.warn(
      logSymbols.warning,
      (`You are using ${packageManager}, but not a known good version. The known ` +
        `versions that work with Electron Forge are: ${whitelistedVersions}`).yellow
    );
  }
}

async function checkPackageManagerVersion() {
  return yarnOrNpmSpawn(['--version'])
    .then((version) => {
      if (hasYarn()) {
        warnIfPackageManagerIsntAKnownGoodVersion('Yarn', version, YARN_WHITELISTED_VERSIONS);
      } else {
        warnIfPackageManagerIsntAKnownGoodVersion('NPM', version, NPM_WHITELISTED_VERSIONS);
      }

      return true;
    });
}

export default async () =>
  (await Promise.all([checkGitExists(), checkNodeVersion(), checkPackageManagerVersion()]))
    .every(check => check);

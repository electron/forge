import { exec } from 'child_process';
import os from 'os';
import path from 'path';

import { utils as forgeUtils } from '@electron-forge/core';
import { ForgeListrTask } from '@electron-forge/shared-types';
import debug from 'debug';
import fs from 'fs-extra';
import semver from 'semver';

const d = debug('electron-forge:check-system');

async function getGitVersion(): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    exec('git --version', (err, output) => (err ? resolve(null) : resolve(output.toString().trim().split(' ').reverse()[0])));
  });
}

async function checkNodeVersion() {
  const { engines } = await fs.readJson(path.resolve(__dirname, '..', '..', 'package.json'));
  const versionSatisfied = semver.satisfies(process.versions.node, engines.node);

  if (!versionSatisfied) {
    throw new Error(`You are running Node.js version ${process.versions.node}, but Electron Forge requires Node.js ${engines.node}.`);
  }

  return process.versions.node;
}

const NPM_ALLOWLISTED_VERSIONS = {
  all: '^3.0.0 || ^4.0.0 || ~5.1.0 || ~5.2.0 || >= 5.4.2',
  darwin: '>= 5.4.0',
  linux: '>= 5.4.0',
};
const YARN_ALLOWLISTED_VERSIONS = {
  all: '>= 1.0.0',
};

export function checkValidPackageManagerVersion(packageManager: string, version: string, allowlistedVersions: string) {
  if (!semver.valid(version)) {
    d(`Invalid semver-string while checking version: ${version}`);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    throw new Error(`Could not check ${packageManager} version "${version}", assuming incompatible`);
  }
  if (!semver.satisfies(version, allowlistedVersions)) {
    throw new Error(`Incompatible version of ${packageManager} detected "${version}", must be in range ${allowlistedVersions}`);
  }
}

function warnIfPackageManagerIsntAKnownGoodVersion(packageManager: string, version: string, allowlistedVersions: { [key: string]: string }) {
  const osVersions = allowlistedVersions[process.platform];
  const versions = osVersions ? `${allowlistedVersions.all} || ${osVersions}` : allowlistedVersions.all;
  const versionString = version.toString();
  checkValidPackageManagerVersion(packageManager, versionString, versions);
}

async function checkPackageManagerVersion() {
  const version = await forgeUtils.yarnOrNpmSpawn(['--version']);
  const versionString = version.toString().trim();
  if (forgeUtils.hasYarn()) {
    warnIfPackageManagerIsntAKnownGoodVersion('Yarn', versionString, YARN_ALLOWLISTED_VERSIONS);
    return `yarn@${versionString}`;
  } else {
    warnIfPackageManagerIsntAKnownGoodVersion('NPM', versionString, NPM_ALLOWLISTED_VERSIONS);
    return `npm@${versionString}`;
  }
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

type SystemCheckContext = {
  git: boolean;
  node: boolean;
  packageManager: boolean;
};
export async function checkSystem(task: ForgeListrTask<never>) {
  if (!(await fs.pathExists(SKIP_SYSTEM_CHECK))) {
    d('checking system, create ~/.skip-forge-system-check to stop doing this');
    return task.newListr<SystemCheckContext>(
      [
        {
          title: 'Checking git exists',
          task: async (_, task) => {
            const gitVersion = await getGitVersion();
            if (gitVersion) {
              task.title = `Found git@${gitVersion}`;
            } else {
              throw new Error('Could not find git in environment');
            }
          },
        },
        {
          title: 'Checking node version',
          task: async (_, task) => {
            const nodeVersion = await checkNodeVersion();
            task.title = `Found node@${nodeVersion}`;
          },
        },
        {
          title: 'Checking packageManager version',
          task: async (_, task) => {
            const packageManager = await checkPackageManagerVersion();
            task.title = `Found ${packageManager}`;
          },
        },
      ],
      {
        concurrent: true,
        exitOnError: false,
        rendererOptions: {
          collapseSubtasks: true,
        },
      }
    );
  }
  d('skipping system check');
  return true;
}

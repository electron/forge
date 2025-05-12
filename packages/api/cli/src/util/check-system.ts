import { exec } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

import { PACKAGE_MANAGERS, resolvePackageManager, spawnPackageManager, SupportedPackageManager } from '@electron-forge/core-utils';
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

/**
 * Packaging an app with Electron Forge requires `node_modules` to be on disk.
 * With `pnpm`, this can be done in a few different ways.
 *
 * `node-linker=hoisted` replicates the behaviour of npm and Yarn Classic, while
 * users may choose to set `public-hoist-pattern` or `hoist-pattern` for advanced
 * configuration purposes.
 */
async function checkPnpmConfig() {
  const { pnpm } = PACKAGE_MANAGERS;
  const hoistPattern = await spawnPackageManager(pnpm, ['config', 'get', 'hoist-pattern']);
  const publicHoistPattern = await spawnPackageManager(pnpm, ['config', 'get', 'public-hoist-pattern']);

  if (hoistPattern !== 'undefined' || publicHoistPattern !== 'undefined') {
    d(
      `Custom hoist pattern detected ${JSON.stringify({
        hoistPattern,
        publicHoistPattern,
      })}, assuming that the user has configured pnpm to package dependencies.`
    );
    return;
  }

  const nodeLinker = await spawnPackageManager(pnpm, ['config', 'get', 'node-linker']);
  if (nodeLinker !== 'hoisted') {
    throw new Error(
      'When using pnpm, `node-linker` must be set to "hoisted" (or a custom `hoist-pattern` or `public-hoist-pattern` must be defined). Run `pnpm config set node-linker hoisted` to set this config value, or add it to your project\'s `.npmrc` file.'
    );
  }
}

// TODO(erickzhao): Drop antiquated versions of npm for Forge v8
const ALLOWLISTED_VERSIONS: Record<SupportedPackageManager, Record<string, string>> = {
  npm: {
    all: '^3.0.0 || ^4.0.0 || ~5.1.0 || ~5.2.0 || >= 5.4.2',
    darwin: '>= 5.4.0',
    linux: '>= 5.4.0',
  },
  yarn: {
    all: '>= 1.0.0',
  },
  pnpm: {
    all: '>= 8.0.0',
  },
};

export async function checkPackageManager() {
  const pm = await resolvePackageManager();
  const version = pm.version ?? (await spawnPackageManager(pm, ['--version']));
  const versionString = version.toString().trim();

  const range = ALLOWLISTED_VERSIONS[pm.executable][process.platform] ?? ALLOWLISTED_VERSIONS[pm.executable].all;
  if (!semver.valid(version)) {
    d(`Invalid semver-string while checking version: ${version}`);
    throw new Error(`Could not check ${pm.executable} version "${version}", assuming incompatible`);
  }
  if (!semver.satisfies(version, range)) {
    throw new Error(`Incompatible version of ${pm.executable} detected: "${version}" must be in range ${range}`);
  }

  if (pm.executable === 'pnpm') {
    await checkPnpmConfig();
  }

  return `${pm.executable}@${versionString}`;
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

export type SystemCheckContext = {
  command: string;
  git: boolean;
  node: boolean;
  packageManager: boolean;
};

export async function checkSystem(callerTask: ForgeListrTask<SystemCheckContext>) {
  if (!(await fs.pathExists(SKIP_SYSTEM_CHECK))) {
    d('checking system, create ~/.skip-forge-system-check to stop doing this');
    return callerTask.newListr<SystemCheckContext>(
      [
        {
          title: 'Checking git exists',
          // We only call the `initGit` helper in the `init` and `import` commands
          enabled: (ctx): boolean => (ctx.command === 'init' || ctx.command === 'import') && ctx.git,
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
          title: 'Checking package manager version',
          task: async (_, task) => {
            const packageManager = await checkPackageManager();
            task.title = `Found ${packageManager}`;
          },
        },
      ],
      {
        concurrent: true,
        exitOnError: true,
        rendererOptions: {
          collapseSubtasks: true,
        },
      }
    );
  }
  d('skipping system check');
  return true;
}

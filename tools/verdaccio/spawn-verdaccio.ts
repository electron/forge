/**
 * This script runs any command with a local Verdaccio instance that
 * publishes local builds of all `@electron-forge/` packages to the
 * proxy registry.
 *
 * This is useful to test the local build of Electron Forge prior
 * to publishing the monorepo, and to wire up `init` tests against
 * the latest and greatest.
 *
 * Usage:
 *   tsx tools/verdaccio/spawn-verdaccio.ts [command] [args...]
 *
 * Examples:
 *   tsx tools/verdaccio/spawn-verdaccio.ts yarn test:slow
 *   tsx tools/verdaccio/spawn-verdaccio.ts  # Keeps Verdaccio running for manual testing
 */

import { ChildProcess, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { spawn as spawnPromise } from '@malept/cross-spawn-promise';
import debug from 'debug';

const FORGE_ROOT_DIR = path.resolve(import.meta.dirname, '../..');
/**
 * Path to the Verdaccio configuration file.
 * The below constants are derived from settings in the YAML.
 */
const CONFIG_PATH = path.resolve(import.meta.dirname, 'config.yaml');

const LOCALHOST = '127.0.0.1';
const VERDACCIO_PORT = 4873;
const VERDACCIO_URL = `http://${LOCALHOST}:${VERDACCIO_PORT}`;
const STORAGE_PATH = path.resolve(import.meta.dirname, 'storage');

/**
 * We publish the monorepo to Verdaccio seconds before the tests install it, so
 * every package manager's minimum age gate (which Yarn enables by default since
 * 4.18) quarantines every local package. The tests install those packages into
 * app directories created under `os.tmpdir()`, which are outside this repository
 * and therefore never pick up the root `.yarnrc.yml`, so we mirror its policy
 * for all three package managers here instead of switching the gate off: our own
 * packages are exempt, everything else still has to have been on the registry
 * for a week. Keep these in sync with `.yarnrc.yml`.
 */
const MINIMUM_RELEASE_AGE_MINUTES = 10080;
const MINIMUM_RELEASE_AGE_DAYS = MINIMUM_RELEASE_AGE_MINUTES / 60 / 24;
const PREAPPROVED_PACKAGES = [
  '@electron/*',
  '@electron-forge/*',
  '@electron-internal/*',
  'create-electron-app',
  'electron',
  'node-abi',
];

const d = debug('electron-forge:verdaccio');

let verdaccioProcess: ChildProcess | null = null;

/**
 * Starts the Verdaccio server.
 */
async function startVerdaccio(): Promise<void> {
  console.log('🚀 Starting Verdaccio...');

  // Clean up old storage
  await fs.promises.rm(STORAGE_PATH, { recursive: true, force: true });
  await fs.promises.mkdir(STORAGE_PATH);

  return new Promise((resolve, reject) => {
    verdaccioProcess = spawn('yarn', ['verdaccio', '--config', CONFIG_PATH], {
      cwd: FORGE_ROOT_DIR,
      // On Windows, detaching the child process will cause the Promise to hang
      // On UNIX-based platforms, detatching it is necessary to successfully kill the Verdaccio server
      detached: process.platform !== 'win32',
      shell: process.platform === 'win32',
    });

    let started = false;

    verdaccioProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      d(output);
      if (output.includes('http address') && !started) {
        started = true;
        // Give it a moment to be fully ready
        setTimeout(resolve, 500);
      }
    });

    verdaccioProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();
      console.error('[verdaccio]', output);
    });

    verdaccioProcess.on('error', reject);
    verdaccioProcess.on('close', (code) => {
      if (!started || code !== 0) {
        reject(new Error(`Verdaccio exited with code ${code}`));
      }
    });
  });
}

/**
 * Kills the local Verdaccio instance.
 */
function stopVerdaccio(): void {
  if (verdaccioProcess && verdaccioProcess.pid) {
    console.log('🛑 Stopping Verdaccio...');
    // Kill the entire process group (negative PID) to ensure all child processes are terminated
    try {
      process.kill(-verdaccioProcess.pid, 'SIGTERM');
    } catch {
      // Process may have already exited
      verdaccioProcess.kill('SIGTERM');
    }
    verdaccioProcess = null;
  }
}

/**
 * Publishes all `@electron-forge/` packages to the localhost Verdaccio registry.
 */
async function publishPackages(): Promise<void> {
  console.log('📦 Publishing monorepo packages to Verdaccio registry...');

  try {
    await spawnPromise(
      `yarn`,
      [
        'lerna',
        'publish',
        'from-package',
        '--registry',
        VERDACCIO_URL,
        '--yes',
        '--no-git-tag-version',
        '--no-push',
        '--skip-check-working-tree',
      ],
      {
        cwd: FORGE_ROOT_DIR,
        stdio: 'inherit',
      },
    );
    console.log('✅ All packages published to Verdaccio registry');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to publish packages:', errorMessage);
    throw error;
  }
}

async function runCommand(args: string[]) {
  process.env.COREPACK_ENABLE_STRICT = '0';

  /**
   * `yarn test:verdaccio` runs Yarn through Corepack, which sets
   * `COREPACK_ROOT` for everything it spawns, and the tests inherit it all the
   * way down to the package manager that installs each generated app. pnpm
   * refuses to switch to the version it is asked for when it believes Corepack
   * invoked it, and `create-electron-app` asks Corepack to pin the latest pnpm
   * in every app it creates, so the first install in a pnpm app fails with a
   * version mismatch against whatever pnpm happens to be on `PATH`. The tests
   * spawn their own package managers and have no business inheriting this
   * repository's Corepack context, so we drop the variable here.
   */
  const { COREPACK_ROOT: _corepackRoot, ...parentEnv } = process.env;

  /**
   * Avoid polluting the global yarn cache.
   */
  const tempYarnGlobal = path.join(STORAGE_PATH, '.yarn-global');
  await fs.promises.mkdir(tempYarnGlobal, { recursive: true });

  /**
   * npm and Yarn take their settings from the environment, but pnpm reads these
   * ones from its config files only, so we generate a global config file for it
   * and point pnpm at it with `XDG_CONFIG_HOME` (which pnpm honors on every
   * platform, including Windows). The tests install into throwaway directories,
   * so the alternative would be writing a `pnpm-workspace.yaml` into each of
   * them, but that would also make Forge's own `resolvePackageManager` treat
   * them as pnpm projects, which we don't want in the npm/Yarn cases.
   *
   * Note that any other tool the tests run also picks up this config home (on
   * Linux, for instance, the test apps write their Electron `userData` there),
   * which is harmless because the directory is thrown away on the next run.
   */
  const tempXdgConfigHome = path.join(STORAGE_PATH, '.xdg-config-home');
  await fs.promises.mkdir(path.join(tempXdgConfigHome, 'pnpm'), {
    recursive: true,
  });
  await fs.promises.writeFile(
    path.join(tempXdgConfigHome, 'pnpm', 'config.yaml'),
    // YAML is a superset of JSON, so this is a valid pnpm config file.
    JSON.stringify(
      {
        /**
         * pnpm reads the registry from its config files and from `--registry`,
         * but not from `npm_config_registry` in the environment, so it is the
         * one package manager that does not pick up `NPM_CONFIG_REGISTRY`
         * below. Without this line pnpm quietly resolves `@electron-forge/*`
         * from the public registry instead of from Verdaccio, and the tests
         * pass against the last published release rather than the local build.
         * https://pnpm.io/settings#registry
         */
        registry: VERDACCIO_URL,
        // https://pnpm.io/settings#minimumreleaseage
        minimumReleaseAge: MINIMUM_RELEASE_AGE_MINUTES,
        // https://pnpm.io/settings#minimumreleaseageexclude
        minimumReleaseAgeExclude: PREAPPROVED_PACKAGES,
        /**
         * Every run republishes the monorepo under the version that is already
         * in the manifests, so pnpm must not resolve those packages through
         * metadata it cached during an earlier run: it would then look up the
         * integrity hash that version had last time and find the matching
         * tarball in its store, which is how the tests would end up running
         * against a stale build. `startVerdaccio` deletes `STORAGE_PATH`, so a
         * cache directory under it is empty on every run, which forces pnpm to
         * ask Verdaccio for the hashes it is serving now.
         *
         * The store itself is deliberately left alone: it only holds content
         * addressed by hash, so once the metadata is gone it cannot serve a
         * stale tarball, and keeping it saves every run from downloading all of
         * the third-party dependencies again. Emptying it with `pnpm store
         * prune` was the previous approach.
         * https://pnpm.io/settings#cachedir
         */
        cacheDir: path.join(STORAGE_PATH, '.pnpm-cache'),
        /**
         * Since pnpm 11, `pnpm run` silently runs an install first whenever it
         * decides that `node_modules` is out of sync with the lockfile. The
         * tests run `<package manager> run start` to check that the app
         * `create-electron-app` just installed can start, so an install in
         * between replaces the very thing they are checking: on Windows it
         * rewrote the dependency tree into one where the generated
         * `forge.config.ts` could no longer resolve the Forge plugin it
         * imports. `warn` keeps the check itself, and its report of whatever it
         * believes is out of sync, without acting on it.
         * https://pnpm.io/settings#verifydepsbeforerun
         */
        verifyDepsBeforeRun: 'warn',
        /**
         * Whether pnpm links dependencies through a store-wide virtual store or
         * one inside the project defaults to whether pnpm believes it is
         * running in CI, which these tests cannot keep consistent: they install
         * with the environment they inherit and then run the app's `start`
         * script with a minimal one, so pnpm read the same project two
         * different ways and reported that `node_modules` no longer matched the
         * lockfile. Pin it to the value CI would pick anyway.
         * https://pnpm.io/settings#enableglobalvirtualstore
         */
        enableGlobalVirtualStore: false,
      },
      null,
      2,
    ),
  );

  /**
   * npm only learned about `min-release-age` in 11.19. Older versions install
   * without a gate and warn that the config is unknown on every single npm
   * invocation, so we only pass it when it is supported and say once that the
   * npm side of the tests is ungated.
   */
  const npmVersion = (await spawnPromise('npm', ['--version'])).trim();
  const [npmMajor, npmMinor] = npmVersion.split('.').map(Number);
  const npmSupportsAgeGate =
    npmMajor > 11 || (npmMajor === 11 && npmMinor >= 19);
  if (!npmSupportsAgeGate) {
    console.warn(
      `⚠️  npm ${npmVersion} does not support \`min-release-age\` (npm >= 11.19 required), so npm installs in these tests are not age-gated`,
    );
  }

  console.log(`🏃 Running: ${args.join(' ')}`);
  console.log(`   Using registry: ${VERDACCIO_URL}`);

  await spawnPromise(args[0], args.slice(1), {
    cwd: FORGE_ROOT_DIR,
    stdio: 'inherit',
    env: {
      ...parentEnv,
      // https://docs.npmjs.com/cli/v9/using-npm/config#registry
      // https://pnpm.io/settings#registry
      NPM_CONFIG_REGISTRY: VERDACCIO_URL,
      // https://yarnpkg.com/configuration/yarnrc#npmRegistryServer
      YARN_NPM_REGISTRY_SERVER: VERDACCIO_URL,
      // https://yarnpkg.com/configuration/yarnrc#unsafeHttpWhitelist
      YARN_UNSAFE_HTTP_WHITELIST: LOCALHOST,
      // Yarn's minimum age gate is 1 day by default since Yarn 4.18.
      // https://yarnpkg.com/configuration/yarnrc#npmMinimalAgeGate
      YARN_NPM_MINIMAL_AGE_GATE: String(MINIMUM_RELEASE_AGE_MINUTES),
      // Yarn only accepts comma-separated values for array settings passed
      // through the environment.
      // https://yarnpkg.com/configuration/yarnrc#npmPreapprovedPackages
      YARN_NPM_PREAPPROVED_PACKAGES: PREAPPROVED_PACKAGES.join(','),
      ...(npmSupportsAgeGate && {
        // npm calls the same policy `min-release-age` and counts it in days
        // instead of minutes.
        // https://docs.npmjs.com/cli/v12/using-npm/config#min-release-age
        npm_config_min_release_age: String(MINIMUM_RELEASE_AGE_DAYS),
        // Like Yarn, npm accepts a comma-separated list for this array setting.
        // https://docs.npmjs.com/cli/v12/using-npm/config#min-release-age-exclude
        npm_config_min_release_age_exclude: PREAPPROVED_PACKAGES.join(','),
      }),
      // Where pnpm looks for the global config file generated above.
      XDG_CONFIG_HOME: tempXdgConfigHome,
      // Isolate package manager caches so Verdaccio packages
      // don't corrupt the global caches. These directories live
      // under STORAGE_PATH and get cleaned up on next run.
      // https://yarnpkg.com/configuration/yarnrc#globalFolder
      YARN_GLOBAL_FOLDER: tempYarnGlobal,
      // https://yarnpkg.com/configuration/yarnrc#enableGlobalCache
      YARN_ENABLE_GLOBAL_CACHE: 'false',
    },
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle signals
  process.on('SIGINT', () => {
    stopVerdaccio();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    stopVerdaccio();
    process.exit(0);
  });

  try {
    await startVerdaccio();
    await publishPackages();

    if (args.length === 0) {
      // No command provided - keep Verdaccio running for manual testing
      console.log(`\n✅ Verdaccio is running at ${VERDACCIO_URL}`);
      console.log('   Press Ctrl+C to stop.\n');
      // Keep the process alive
      await new Promise(() => {});
    } else {
      await runCommand(args);
      stopVerdaccio();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    stopVerdaccio();
    process.exit(1);
  }
}

main();

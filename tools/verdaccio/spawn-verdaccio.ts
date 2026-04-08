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

  return new Promise<void>((resolve, reject) => {
    const child: ChildProcess = spawn(
      'yarn',
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
        stdio: 'pipe',
      },
    );

    let stderr = '';

    child.stdout?.pipe(process.stdout);
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Failed to publish packages (exit code ${code})\n${stderr}`,
          ),
        );
      } else {
        console.log('✅ All packages published to Verdaccio registry');
        resolve();
      }
    });
  });
}

async function runCommand(args: string[]): Promise<void> {
  process.env.COREPACK_ENABLE_STRICT = '0';
  console.log('🗑️  Pruning pnpm store before running command');
  await spawnPromise('pnpm', ['store', 'prune']);

  /**
   * Avoid polluting the global yarn cache.
   */
  const tempYarnGlobal = path.join(STORAGE_PATH, '.yarn-global');
  fs.promises.mkdir(tempYarnGlobal, { recursive: true });

  console.log(`🏃 Running: ${args.join(' ')}`);
  console.log(`   Using registry: ${VERDACCIO_URL}`);

  return new Promise<void>((resolve, reject) => {
    const child: ChildProcess = spawn(args[0], args.slice(1), {
      cwd: FORGE_ROOT_DIR,
      stdio: 'pipe',
      env: {
        ...process.env,
        // https://docs.npmjs.com/cli/v9/using-npm/config#registry
        // https://pnpm.io/settings#registry
        NPM_CONFIG_REGISTRY: VERDACCIO_URL,
        // https://yarnpkg.com/configuration/yarnrc#npmRegistryServer
        YARN_NPM_REGISTRY_SERVER: VERDACCIO_URL,
        // https://yarnpkg.com/configuration/yarnrc#unsafeHttpWhitelist
        YARN_UNSAFE_HTTP_WHITELIST: LOCALHOST,
        // Isolate package manager caches so Verdaccio packages
        // don't corrupt the global caches. These directories live
        // under STORAGE_PATH and get cleaned up on next run.
        // https://yarnpkg.com/configuration/yarnrc#globalFolder
        YARN_GLOBAL_FOLDER: tempYarnGlobal,
        // https://yarnpkg.com/configuration/yarnrc#enableGlobalCache
        YARN_ENABLE_GLOBAL_CACHE: 'false',
      },
    });

    let stderr = '';

    child.stdout?.pipe(process.stdout);
    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
      process.stderr.write(data);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Command "${args.join(' ')}" exited with code ${code}\n${stderr}`,
          ),
        );
      } else {
        resolve();
      }
    });
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

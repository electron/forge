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
 *   tsx tools/verdaccio/spawn-verdaccio.ts <command> [args...]
 *
 * Example:
 *   tsx tools/verdaccio-spawn-verdaccio.ts yarn test:slow
 */

import { ChildProcess, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { spawn as spawnPromise } from '@malept/cross-spawn-promise';
import debug from 'debug';

const FORGE_ROOT_DIR = path.resolve(__dirname, '../..');
/**
 * Path to the Verdaccio configuration file.
 * The below constants are derived from settings in the YAML.
 */
const CONFIG_PATH = path.resolve(__dirname, 'config.yaml');

const LOCALHOST = '127.0.0.1';
const VERDACCIO_PORT = 4873;
const VERDACCIO_URL = `http://${LOCALHOST}:${VERDACCIO_PORT}`;
const STORAGE_PATH = path.resolve(__dirname, 'storage');

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
  console.log(`🏃 Running: ${args.join(' ')}`);
  console.log(`   Using registry: ${VERDACCIO_URL}`);

  await spawnPromise(args[0], args.slice(1), {
    cwd: FORGE_ROOT_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      // https://docs.npmjs.com/cli/v9/using-npm/config#registry
      // https://pnpm.io/settings#registry
      NPM_CONFIG_REGISTRY: VERDACCIO_URL,
      // https://yarnpkg.com/configuration/yarnrc#npmRegistryServer
      YARN_NPM_REGISTRY_SERVER: VERDACCIO_URL,
      // https://yarnpkg.com/configuration/yarnrc#unsafeHttpWhitelist
      YARN_UNSAFE_HTTP_WHITELIST: LOCALHOST,
    },
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      'Usage: tsx tools/verdaccio/spawn-verdaccio.ts <command> [args...]',
    );
    console.error(
      'Example: tsx tools/verdaccio/spawn-verdaccio.ts yarn test:slow',
    );
    process.exit(1);
  }

  // Handle signals
  process.on('SIGINT', () => {
    stopVerdaccio();
    process.exit(1);
  });
  process.on('SIGTERM', () => {
    stopVerdaccio();
    process.exit(1);
  });

  try {
    await startVerdaccio();
    await publishPackages();
    await runCommand(args);
    stopVerdaccio();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    stopVerdaccio();
    process.exit(1);
  }
}

main();

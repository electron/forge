/**
 * This script runs tests with a local Verdaccio npm registry.
 * It publishes all \@electron-forge/* packages to Verdaccio so that
 * api.init tests can install packages that haven't been published to npm yet.
 *
 * Usage:
 *   tsx tools/verdaccio/run-with-verdaccio.ts <command> [args...]
 *
 * Example:
 *   tsx tools/verdaccio/run-with-verdaccio.ts yarn test:slow
 */

import { ChildProcess, execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERDACCIO_PORT = 4873;
const VERDACCIO_URL = `http://127.0.0.1:${VERDACCIO_PORT}`;
const CONFIG_PATH = path.resolve(__dirname, 'config.yaml');
const STORAGE_PATH = path.resolve(__dirname, 'storage');
const ROOT_DIR = path.resolve(__dirname, '../..');

let verdaccioProcess: ChildProcess | null = null;

async function startVerdaccio(): Promise<void> {
  console.log('🚀 Starting Verdaccio...');

  // Clean up old storage
  await fs.promises.rm(STORAGE_PATH, { recursive: true, force: true });
  await fs.promises.mkdir(STORAGE_PATH);

  return new Promise((resolve, reject) => {
    verdaccioProcess = spawn('yarn', ['verdaccio', '--config', CONFIG_PATH], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;

    verdaccioProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      if (process.env.DEBUG) {
        console.log('[verdaccio]', output);
      }
      if (output.includes('http address') && !started) {
        started = true;
        // Give it a moment to be fully ready
        setTimeout(resolve, 500);
      }
    });

    verdaccioProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();
      // Ignore some noisy warnings
      if (!output.includes('ExperimentalWarning')) {
        console.error('[verdaccio]', output);
      }
    });

    verdaccioProcess.on('error', reject);
    verdaccioProcess.on('close', (code) => {
      if (!started) {
        reject(new Error(`Verdaccio exited with code ${code}`));
      }
    });

    // Timeout if Verdaccio doesn't start
    setTimeout(() => {
      if (!started) {
        reject(new Error('Verdaccio failed to start within 30 seconds'));
      }
    }, 30000);
  });
}

function stopVerdaccio(): void {
  if (verdaccioProcess) {
    console.log('🛑 Stopping Verdaccio...');
    verdaccioProcess.kill('SIGTERM');
    verdaccioProcess = null;
  }
}

async function publishPackages(): Promise<void> {
  console.log('📦 Publishing packages to Verdaccio...');

  try {
    execSync(
      `yarn lerna publish from-package --registry ${VERDACCIO_URL} --yes --no-git-tag-version --no-push`,
      {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        env: {
          ...process.env,
          npm_config_registry: VERDACCIO_URL,
        },
      },
    );
    console.log('✅ All packages published to Verdaccio');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to publish packages:', errorMessage);
    throw error;
  }
}

async function runCommand(args: string[]): Promise<number> {
  console.log(`🏃 Running: ${args.join(' ')}`);
  console.log(`   Using registry: ${VERDACCIO_URL}`);

  return new Promise((resolve) => {
    const child = spawn(args[0], args.slice(1), {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      env: {
        ...process.env,
        npm_config_registry: VERDACCIO_URL,
        YARN_NPM_REGISTRY_SERVER: VERDACCIO_URL,
        // For pnpm
        NPM_CONFIG_REGISTRY: VERDACCIO_URL,
      },
    });

    child.on('close', (code) => {
      resolve(code ?? 1);
    });
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      'Usage: tsx tools/verdaccio/run-with-verdaccio.ts <command> [args...]',
    );
    console.error(
      'Example: tsx tools/verdaccio/run-with-verdaccio.ts yarn test:slow',
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
    const exitCode = await runCommand(args);
    stopVerdaccio();
    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Error:', error);
    stopVerdaccio();
    process.exit(1);
  }
}

main();

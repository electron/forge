/**
 * Utility script to regenerate lockfile fixtures for template tests.
 *
 * Run this script whenever the lockfile changes for any production dependency
 * in Forge (or when a new version is published).
 *
 * This script uses the local version of `electron-forge` to initialize
 * a new project in a temporary directory using the specified template.
 * Note that you must run `yarn build` first.
 *
 * Usage:
 *   yarn update:lockfile-fixtures
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ELECTRON_VERSION = '38.2.2';

async function ensureDirectoryExists(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

// Helper to create a unique test directory (replaces testUtils.ensureTestDirIsNonexistent)
async function ensureTestDirIsNonexistent(): Promise<string> {
  const dir = path.join(os.tmpdir(), `electron-forge-test-${Date.now()}`);
  await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

async function initForgeProject(dir: string, template: string): Promise<void> {
  const cliPath = path.resolve(
    import.meta.dirname,
    '..',
    'packages',
    'api',
    'cli',
    'dist',
    'electron-forge-init.js',
  );

  if (!fs.existsSync(cliPath)) {
    throw new Error(
      `Cannot find electron-forge CLI at ${cliPath}. Did you run "yarn build"?`,
    );
  }

  return new Promise((resolve, reject) => {
    const child = spawn(
      'node',
      [
        cliPath,
        '.',
        '--template',
        template,
        '--electron-version',
        ELECTRON_VERSION,
      ],
      {
        cwd: dir,
        stdio: 'inherit',
        shell: process.platform === 'win32',
      },
    );

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`electron-forge init exited with code ${code}`));
      }
    });
  });
}

async function regenerateWebpackTypescriptLockfile() {
  console.log('Regenerating webpack-typescript lockfile fixture');

  const dir = await ensureTestDirIsNonexistent();

  try {
    const template = path.resolve(
      import.meta.dirname,
      '..',
      'packages',
      'template',
      'webpack-typescript',
      'dist',
      'WebpackTypeScriptTemplate.js',
    );
    await initForgeProject(dir, template);

    const fixtureDir = path.resolve(
      import.meta.dirname,
      '..',
      'packages',
      'template',
      'webpack-typescript',
      'spec',
      'fixtures',
    );
    await ensureDirectoryExists(fixtureDir);

    const lockfilePath = path.join(dir, 'yarn.lock');
    const fixturePath = path.join(fixtureDir, 'test-yarn.lock');

    await fs.promises.copyFile(lockfilePath, fixturePath);
    console.log(`Saved to: ${path.relative(process.cwd(), fixturePath)}`);

    await fs.promises.rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error regenerating webpack-typescript lockfile:', error);
    throw error;
  }
}

async function regenerateViteTypescriptLockfile() {
  console.log('Regenerating vite-typescript lockfile fixture...');

  const dir = await ensureTestDirIsNonexistent();

  try {
    const template = path.resolve(
      import.meta.dirname,
      '..',
      'packages',
      'template',
      'vite-typescript',
      'dist',
      'ViteTypeScriptTemplate.js',
    );
    await initForgeProject(dir, template);

    const fixtureDir = path.resolve(
      import.meta.dirname,
      '..',
      'packages',
      'template',
      'vite-typescript',
      'spec',
      'fixtures',
    );
    await ensureDirectoryExists(fixtureDir);

    const lockfilePath = path.join(dir, 'yarn.lock');
    const fixturePath = path.join(fixtureDir, 'test-yarn.lock');

    await fs.promises.copyFile(lockfilePath, fixturePath);
    console.log(`Saved to: ${path.relative(process.cwd(), fixturePath)}`);

    await fs.promises.rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error regenerating vite-typescript lockfile:', error);
    throw error;
  }
}

async function main() {
  console.log('Starting lockfile fixture regeneration...\n');

  try {
    await regenerateWebpackTypescriptLockfile();
    console.log('');
    await regenerateViteTypescriptLockfile();

    console.log('\n All lockfile fixtures regenerated successfully!');
    console.log('\n Remember to commit the updated fixtures:');
    console.log('  git add packages/template/*/spec/fixtures/test-yarn.lock');
    console.log('  git commit -m "chore: update template lockfile fixtures"');
  } catch {
    console.error('\n Failed to regenerate lockfile fixtures');
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(() => {
    process.exit(1);
  });
}

#!/usr/bin/env ts-node

/**
 * Utility script to regenerate lockfile fixtures for template tests.
 *
 * Run this script when:
 * - Webpack or Vite versions are updated in the main Forge package.json
 * - Template dependencies change significantly
 * - Yarn lockfile format changes
 * - Template tests start failing due to outdated lockfiles
 *
 * Usage:
 *   yarn ts-node tools/regenerate-lockfile-fixtures.ts
 *   or
 *   yarn update:lockfile-fixtures (if added to package.json scripts)
 */

import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

async function ensureDirectoryExists(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

// Helper to create a unique test directory (replaces testUtils.ensureTestDirIsNonexistent)
async function ensureTestDirIsNonexistent(): Promise<string> {
  const dir = path.join(
    os.tmpdir(),
    `electron-forge-test-${Date.now()}-${process.pid}`,
  );
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// Helper to spawn package manager commands (replaces spawnPackageManager)
async function runYarnCommand(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('yarn', args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yarn ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
}

// Helper to run electron-forge init (replaces api.init)
async function initForgeProject(dir: string, template: string): Promise<void> {
  const cliPath = path.resolve(
    __dirname,
    '..',
    'packages',
    'api',
    'cli',
    'dist',
    'electron-forge-init.js',
  );

  return new Promise((resolve, reject) => {
    const child = spawn('node', [cliPath, '.', '--template', template], {
      cwd: dir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

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
      __dirname,
      '..',
      'packages',
      'template',
      'webpack-typescript',
    );
    await initForgeProject(dir, template);

    const packageJsonPath = path.join(dir, 'package.json');
    const pj = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    const webpackPackageJson = JSON.parse(
      await fs.readFile(
        path.resolve(
          __dirname,
          '..',
          'node_modules',
          'webpack',
          'package.json',
        ),
        'utf-8',
      ),
    );
    const webpackVersion = webpackPackageJson.version;
    pj.resolutions = {
      webpack: webpackVersion,
    };

    await fs.writeFile(packageJsonPath, JSON.stringify(pj, null, 2));

    console.log(`  Added webpack resolution: ${webpackVersion}`);

    console.log('  Running yarn install...');
    await runYarnCommand(['install'], dir);

    const fixtureDir = path.resolve(
      __dirname,
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

    await fs.copyFile(lockfilePath, fixturePath);
    console.log(`Saved to: ${path.relative(process.cwd(), fixturePath)}`);

    await fs.rm(dir, { recursive: true, force: true });
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
      __dirname,
      '..',
      'packages',
      'template',
      'vite-typescript',
    );
    await initForgeProject(dir, template);

    const packageJsonPath = path.join(dir, 'package.json');
    const pj = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    const vitePackageJson = JSON.parse(
      await fs.readFile(
        path.resolve(__dirname, '..', 'node_modules', 'vite', 'package.json'),
        'utf-8',
      ),
    );
    const viteVersion = vitePackageJson.version;
    pj.resolutions = {
      vite: viteVersion,
    };

    await fs.writeFile(packageJsonPath, JSON.stringify(pj, null, 2));

    console.log(`  Added vite resolution: ${viteVersion}`);

    console.log('  Running yarn install...');
    await runYarnCommand(['install'], dir);

    const fixtureDir = path.resolve(
      __dirname,
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

    await fs.copyFile(lockfilePath, fixturePath);
    console.log(`Saved to: ${path.relative(process.cwd(), fixturePath)}`);

    await fs.rm(dir, { recursive: true, force: true });
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
    console.log('git add packages/template/*/spec/fixtures/test-yarn.lock');
    console.log('git commit -m "chore: update template lockfile fixtures"');
  } catch {
    console.error('\n Failed to regenerate lockfile fixtures');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(() => {
    process.exit(1);
  });
}

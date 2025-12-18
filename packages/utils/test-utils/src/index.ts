import os from 'node:os';
import path from 'node:path';

import { ExitError, spawn } from '@malept/cross-spawn-promise';
import fs from 'fs-extra';

export type PackageJSON = Record<string, unknown> & {
  config?: {
    forge?: Record<string, unknown>;
  };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

async function runNPM(dir: string, ...args: string[]) {
  await spawn('npm', args, { cwd: dir });
}

export async function runNPMInstall(dir: string, ...args: string[]) {
  await runNPM(dir, 'install', ...args);
}

export async function ensureModulesInstalled(
  dir: string,
  deps: string[],
  devDeps: string[],
): Promise<void> {
  await runNPMInstall(dir, ...deps);
  await runNPMInstall(dir, '--save-dev', ...devDeps);
}

let dirID = Date.now();

export async function ensureTestDirIsNonexistent(): Promise<string> {
  const dir = path.resolve(os.tmpdir(), `electron-forge-test-${dirID}`);
  dirID += 1;
  await fs.promises.rm(dir, { recursive: true, force: true });

  return dir;
}

export async function expectLintToPass(dir: string): Promise<void> {
  try {
    await runNPM(dir, 'run', 'lint');
  } catch (err) {
    if (err instanceof ExitError) {
      console.error('STDOUT:', err.stdout.toString());
      console.error('STDERR:', err.stderr.toString());
    }
    throw err;
  }
}

/**
 * Mutates the `package.json` file in a directory.
 * Use the return value to later restore the original `package.json` value
 * in a subsequent call of this function.
 *
 * @param dir - The target directory containing the `package.json` file
 * @param callback - A callback function that returns the value of the new `package.json` to be applied
 * @returns The original `package.json` prior to mutation
 */
export async function updatePackageJSON(
  dir: string,
  callback: (packageJSON: PackageJSON) => Promise<PackageJSON>,
) {
  const packageJSON = await fs.readJson(path.resolve(dir, 'package.json'));
  const mutated = await callback(JSON.parse(JSON.stringify(packageJSON)));
  await fs.promises.writeFile(
    path.resolve(dir, 'package.json'),
    JSON.stringify(mutated, null, 2),
    'utf-8',
  );
  return packageJSON;
}

import os from 'node:os';
import path from 'node:path';

import { ExitError, spawn } from '@malept/cross-spawn-promise';
import { expect } from 'chai';
import fs from 'fs-extra';

async function runNPM(dir: string, ...args: string[]) {
  await spawn('npm', args, { cwd: dir });
}

export async function runNPMInstall(dir: string, ...args: string[]) {
  await runNPM(dir, 'install', ...args);
}

export async function ensureModulesInstalled(dir: string, deps: string[], devDeps: string[]): Promise<void> {
  await runNPMInstall(dir, ...deps);
  await runNPMInstall(dir, '--save-dev', ...devDeps);
}

let dirID = Date.now();

export async function ensureTestDirIsNonexistent(): Promise<string> {
  const dir = path.resolve(os.tmpdir(), `electron-forge-test-${dirID}`);
  dirID += 1;
  await fs.remove(dir);

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

export async function expectProjectPathExists(dir: string, subPath: string, pathType: string, exists = true): Promise<void> {
  expect(await fs.pathExists(path.resolve(dir, subPath)), `the ${subPath} ${pathType} should exist`).to.equal(exists);
}

export async function expectProjectPathNotExists(dir: string, subPath: string, pathType: string): Promise<void> {
  await expectProjectPathExists(dir, subPath, pathType, false);
}

/**
 * Helper function to mock CommonJS `require` calls with Vitest.
 *
 * @see https://github.com/vitest-dev/vitest/discussions/3134
 * @param mockedUri - mocked module URI
 * @param stub - stub function to assign to mock
 */
export async function mockRequire(mockedUri: string, stub: any) {
  // eslint-disable-next-line node/no-unsupported-features/es-syntax
  const { Module } = await import('module');

  //@ts-expect-error undocumented functions
  Module._load_original = Module._load;
  //@ts-expect-error undocumented functions
  Module._load = (uri, parent) => {
    if (uri === mockedUri) return stub;
    //@ts-expect-error undocumented functions
    return Module._load_original(uri, parent);
  };
}

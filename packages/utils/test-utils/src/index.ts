import { expect } from 'chai';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { ExitError, spawn } from '@malept/cross-spawn-promise';

async function runNPM(dir: string, ...args: string[]) {
  await spawn('npm', args, { cwd: dir });
}

async function runNPMInstall(dir: string, ...args: string[]) {
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
      // eslint-disable-next-line no-console
      console.error('STDOUT:', err.stdout.toString());
      // eslint-disable-next-line no-console
      console.error('STDERR:', err.stderr.toString());
    }
    throw err;
  }
}

export async function expectProjectPathExists(
  dir: string,
  subPath: string,
  pathType: string,
  exists = true,
): Promise<void> {
  expect(await fs.pathExists(path.resolve(dir, subPath)), `the ${subPath} ${pathType} should exist`).to.equal(exists);
}

export async function expectProjectPathNotExists(dir: string, subPath: string, pathType: string): Promise<void> {
  await expectProjectPathExists(dir, subPath, pathType, false);
}

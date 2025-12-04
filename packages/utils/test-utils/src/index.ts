import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ExitError, spawn } from '@malept/cross-spawn-promise';

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

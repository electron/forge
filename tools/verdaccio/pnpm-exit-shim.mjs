/**
 * A stand-in for `pnpm` that the Verdaccio test harness puts at the front of
 * `PATH` (see `spawn-verdaccio.ts`). It runs the real pnpm and, once pnpm has
 * reported that it is finished, gives it a few seconds to exit on its own and
 * then kills it.
 *
 * pnpm shuts its tarball worker pool down once per install, but any worker call
 * that happens after that lazily creates a new pool that nothing ever shuts
 * down, and the idle worker thread keeps the event loop alive forever. So an
 * install whose last download finishes just after pnpm prints `Done in Xs`
 * writes the lockfile, links everything, reports success and then hangs.
 * Installs that fetch nothing are unaffected, which is why this only shows up
 * in these tests: they always install into a brand new project.
 *
 * Every test here spawns its package manager and waits for it to exit, so the
 * hang costs us the whole test rather than just the process. Delete this shim
 * and its wiring once the fix has shipped in a pnpm release.
 * https://github.com/pnpm/pnpm/issues/13617
 */

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * How long pnpm gets to exit by itself after it says it is done. Long enough
 * that we don't cut a slow-but-healthy shutdown short, short enough that a
 * hang doesn't eat the test timeout.
 */
const EXIT_GRACE_PERIOD_MS = 15_000;

/**
 * What pnpm prints when it has finished the work it was asked to do. `pnpm run`
 * and friends print nothing of the sort, so they are simply left alone.
 */
const DONE_PATTERN = /(^|\n)(Done in |Already up to date)/;

/**
 * How much of a chunk of output has to be kept around to match `DONE_PATTERN`
 * against the next one: anything at least as long as the strings it looks for.
 */
const TAIL_LENGTH = 32;

/**
 * The directory the launcher that runs this file lives in, which the launcher
 * itself tells us about: it is somewhere else entirely, so this file cannot
 * work it out on its own.
 */
const LAUNCHER_DIR = process.env.FORGE_PNPM_EXIT_SHIM_DIR;
if (!LAUNCHER_DIR) {
  throw new Error(
    'FORGE_PNPM_EXIT_SHIM_DIR must point at the directory this shim is installed in',
  );
}

/**
 * The names a real pnpm can have on `PATH`, in the order the OS would pick
 * between them.
 */
const PNPM_FILENAMES =
  process.platform === 'win32'
    ? ['pnpm.exe', 'pnpm.cmd', 'pnpm.bat']
    : ['pnpm'];

// Windows spells this `Path`, and `process.env` only hides the difference until
// it gets copied.
const pathKey =
  Object.keys(process.env).find((key) => key.toUpperCase() === 'PATH') ??
  'PATH';

/**
 * `PATH` without the directory this shim is installed in, which is both where
 * we look for the pnpm we are standing in for and what we hand to it: leaving
 * ourselves in would let anything that resolves `pnpm` through `PATH` — this
 * shim included — end up back here.
 */
const realPath = (process.env[pathKey] ?? '')
  .split(path.delimiter)
  .filter((dir) => dir !== '' && !isLauncherDir(dir));

function isLauncherDir(dir) {
  const [candidate, launcher] = [path.resolve(dir), path.resolve(LAUNCHER_DIR)];
  return process.platform === 'win32'
    ? candidate.toLowerCase() === launcher.toLowerCase()
    : candidate === launcher;
}

const realPnpm = realPath
  .flatMap((dir) => PNPM_FILENAMES.map((filename) => path.join(dir, filename)))
  .find((candidate) => fs.existsSync(candidate));
if (!realPnpm) {
  throw new Error(`pnpm not found on PATH (${realPath.join(path.delimiter)})`);
}

const pnpm = spawn(realPnpm, process.argv.slice(2), {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, [pathKey]: realPath.join(path.delimiter) },
  // Run pnpm in its own process group so that we can take down the version of
  // itself that it hands over to along with it.
  detached: process.platform !== 'win32',
  // `.cmd` and `.bat` files can only be run through a shell.
  shell: process.platform === 'win32',
});

function killPnpm() {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(pnpm.pid), '/t', '/f'], {
      stdio: 'ignore',
    });
  } else {
    try {
      process.kill(-pnpm.pid, 'SIGKILL');
    } catch {
      pnpm.kill('SIGKILL');
    }
  }
}

let exitTimer;
let killedPnpm = false;

/**
 * Pass pnpm's output through untouched — the tests read it — while watching for
 * the point where it has nothing left to do. `DONE_PATTERN` can straddle two
 * chunks, so each chunk is matched together with the tail of the one before it.
 */
function forward(stream, chunk, previousTail) {
  stream.write(chunk);

  const text = `${previousTail}${chunk}`;
  if (exitTimer === undefined && DONE_PATTERN.test(text)) {
    exitTimer = setTimeout(() => {
      process.stderr.write(
        `\n[verdaccio harness] pnpm did not exit ${EXIT_GRACE_PERIOD_MS / 1000}s after reporting that it was done, killing it (https://github.com/pnpm/pnpm/issues/13617)\n`,
      );
      // Once pnpm is gone its output pipes close and this process exits by
      // itself, which flushes whatever it has already written.
      killedPnpm = true;
      killPnpm();
    }, EXIT_GRACE_PERIOD_MS);
  }

  return text.slice(-TAIL_LENGTH);
}

let stdoutTail = '';
pnpm.stdout.on('data', (chunk) => {
  stdoutTail = forward(process.stdout, chunk, stdoutTail);
});

let stderrTail = '';
pnpm.stderr.on('data', (chunk) => {
  stderrTail = forward(process.stderr, chunk, stderrTail);
});

pnpm.on('error', (error) => {
  clearTimeout(exitTimer);
  throw error;
});

// pnpm runs in its own process group, so whoever kills this shim would leave it
// running behind us.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    clearTimeout(exitTimer);
    killPnpm();
    process.exitCode = 1;
  });
}

pnpm.on('exit', (code, signal) => {
  clearTimeout(exitTimer);
  // pnpm had already done what it was asked to do by the time we killed it, so
  // the command it was running succeeded.
  process.exitCode = killedPnpm ? 0 : signal ? 1 : (code ?? 0);
});

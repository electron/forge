/**
 * A stand-in for `pnpm` that the Verdaccio test harness puts at the front of
 * `PATH` (see `spawn-verdaccio.ts`). It runs the real pnpm and, when an install
 * says that it is finished and then never exits, kills it and installs again.
 *
 * pnpm shuts its tarball worker pool down once per install, but a worker call
 * that happens after that lazily creates a new pool which nothing ever shuts
 * down, and the idle worker thread keeps the event loop alive forever. So an
 * install whose last package arrives just too late writes the lockfile, reports
 * success and then hangs. Installs that fetch nothing are unaffected, which is
 * why this only shows up in these tests: they always install into a brand new
 * project. Every test spawns its package manager and waits for it to exit, so
 * the hang costs us the whole test rather than just the process.
 * https://github.com/pnpm/pnpm/issues/13617
 *
 * That late package is also why killing pnpm is not enough on its own: it is
 * still being written when pnpm reports success, so killing pnpm leaves it out
 * of `node_modules` — and pnpm will not put it back. It decides whether a
 * project is up to date from the state files it keeps alongside the packages
 * rather than from the packages themselves, so installing again into a tree it
 * has already recorded is `Already up to date` even with packages missing from
 * it, `--force` included. Discarding those files first makes the next install
 * compare the tree against the store and fill in whatever is not there.
 *
 * Delete this shim and its wiring once the fix has shipped in a pnpm release.
 */

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * How long pnpm gets to exit by itself after it says it is done. Long enough
 * that we don't cut a slow-but-healthy shutdown short, short enough that a hang
 * doesn't eat the test timeout — and cutting one short only costs the install
 * that repairs it.
 */
const EXIT_GRACE_PERIOD_MS = 15_000;

/**
 * How many times to install in total. The hang needs a package to arrive after
 * pnpm has stopped expecting one, so an install that only has to link what is
 * already in the store — which is all a repair has left to do — is very
 * unlikely to hit it again.
 */
const MAX_ATTEMPTS = 3;

/**
 * What pnpm prints when it has finished the work it was asked to do.
 */
const DONE_PATTERN = /(^|\n)(Done in |Already up to date)/;

/**
 * The files pnpm reads to decide that a project already has the dependencies it
 * is being asked to install, which is what stops it from repairing a tree that
 * an interrupted install left incomplete. pnpm writes them itself, so removing
 * them costs nothing beyond the check they exist for.
 */
const INSTALL_STATE_FILES = [
  '.modules.yaml',
  '.package-map.json',
  '.pnpm-workspace-state-v1.json',
];

/**
 * The commands that install packages, and therefore the only ones that can hang
 * this way. Every other command — `pnpm run start`, which the tests use to
 * launch the app they are testing, above all — is left alone entirely: it keeps
 * running long after pnpm has said that it is done, and killing it is the last
 * thing we want.
 */
const INSTALL_COMMANDS = new Set([
  'add',
  'dedupe',
  'fetch',
  'i',
  'import',
  'install',
  'link',
  'prune',
  'remove',
  'rm',
  'un',
  'uninstall',
  'unlink',
  'up',
  'update',
]);

/**
 * How much of a chunk of output has to be kept around to match `DONE_PATTERN`
 * against the next one: anything at least as long as the strings it looks for.
 */
const TAIL_LENGTH = 32;

const pnpmArgs = process.argv.slice(2);

/**
 * These tests only ever run pnpm as `pnpm <command> [flags]`, so the first
 * argument that isn't a flag is the command.
 */
const watchForHang = INSTALL_COMMANDS.has(
  pnpmArgs.find((arg) => !arg.startsWith('-')),
);

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

function report(message) {
  process.stderr.write(`\n[verdaccio harness] ${message}\n`);
}

/**
 * Where to write a record of every pnpm run. `create-electron-app` installs
 * through listr2 with `exitOnError: false` and does not forward what the
 * package manager printed, so a failing test otherwise has nothing to say about
 * the installs that produced the project it is failing on.
 */
const INVOCATION_LOG = process.env.FORGE_PNPM_INVOCATION_LOG;

function recordInvocation(attempt, output, outcome) {
  if (!INVOCATION_LOG) return;

  fs.appendFileSync(
    INVOCATION_LOG,
    [
      `=== pnpm ${pnpmArgs.join(' ')}`,
      `    in ${process.cwd()}${attempt > 1 ? ` (attempt ${attempt})` : ''}`,
      `    ${outcome}`,
      output,
      '',
    ].join('\n'),
  );
}

/**
 * Runs pnpm once. Resolves with how it went: either it exited on its own, and
 * with what status, or it reported that it was done and had to be killed.
 */
function runPnpm(attempt) {
  return new Promise((resolve, reject) => {
    const pnpm = spawn(realPnpm, pnpmArgs, {
      // Watching for the hang means reading pnpm's output on the way past.
      // Anything we are not watching gets the real thing's streams, untouched.
      stdio: watchForHang ? ['inherit', 'pipe', 'pipe'] : 'inherit',
      env: { ...process.env, [pathKey]: realPath.join(path.delimiter) },
      // Run pnpm in its own process group so that we can take down the version
      // of itself that it hands over to along with it.
      detached: process.platform !== 'win32',
      // `.cmd` and `.bat` files can only be run through a shell.
      shell: process.platform === 'win32',
    });

    let exitTimer;
    let hung = false;
    let output = '';

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

    /**
     * Pass pnpm's output through untouched — the tests read it — while watching
     * for the point where it has nothing left to do. `DONE_PATTERN` can
     * straddle two chunks, so each chunk is matched together with the tail of
     * the one before it.
     */
    function forward(stream, chunk, previousTail) {
      stream.write(chunk);
      output += chunk;

      const text = `${previousTail}${chunk}`;
      if (exitTimer === undefined && DONE_PATTERN.test(text)) {
        exitTimer = setTimeout(() => {
          report(
            `pnpm did not exit ${EXIT_GRACE_PERIOD_MS / 1000}s after reporting that it was done, killing it (https://github.com/pnpm/pnpm/issues/13617)`,
          );
          hung = true;
          killPnpm();
        }, EXIT_GRACE_PERIOD_MS);
      }

      return text.slice(-TAIL_LENGTH);
    }

    if (watchForHang) {
      let stdoutTail = '';
      pnpm.stdout.on('data', (chunk) => {
        stdoutTail = forward(process.stdout, chunk, stdoutTail);
      });

      let stderrTail = '';
      pnpm.stderr.on('data', (chunk) => {
        stderrTail = forward(process.stderr, chunk, stderrTail);
      });
    }

    pnpm.on('error', (error) => {
      clearTimeout(exitTimer);
      reject(error);
    });

    // pnpm runs in its own process group, so whoever kills this shim would
    // leave it running behind us.
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.on(signal, () => {
        clearTimeout(exitTimer);
        killPnpm();
        process.exitCode = 1;
      });
    }

    // Once pnpm is gone its output pipes close and whatever it had already
    // written has been flushed.
    pnpm.on('close', (code, signal) => {
      clearTimeout(exitTimer);
      const exitCode = signal ? 1 : (code ?? 0);
      recordInvocation(
        attempt,
        output,
        hung
          ? 'reported that it was done and then had to be killed'
          : `exited with ${exitCode}`,
      );
      resolve({ hung, code: exitCode });
    });
  });
}

/**
 * Makes pnpm stop believing that the project it just installed into is already
 * up to date, so that the next install checks what is actually there. pnpm is
 * run from the directory it installs into throughout these tests.
 */
async function discardInstallState() {
  await Promise.all(
    INSTALL_STATE_FILES.map((file) =>
      fs.promises.rm(path.join(process.cwd(), 'node_modules', file), {
        force: true,
      }),
    ),
  );
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  const { hung, code } = await runPnpm(attempt);

  if (!hung) {
    process.exitCode = code;
    break;
  }

  if (attempt === MAX_ATTEMPTS) {
    report(
      `pnpm hung on every one of ${MAX_ATTEMPTS} attempts, so \`node_modules\` may be missing whatever it was writing when it was killed`,
    );
    process.exitCode = 1;
    break;
  }

  await discardInstallState();
  report(
    `installing again to replace whatever pnpm was still writing when it was killed (attempt ${attempt + 1} of ${MAX_ATTEMPTS})`,
  );
}

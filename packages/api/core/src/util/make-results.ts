import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { pathExists, readJson, writeJson } from '@electron-forge/core-utils';
import { ForgeMakeResult } from '@electron-forge/shared-types';
import debug from 'debug';

const d = debug('electron-forge:make-results');

/**
 * Name of the directory (inside the Forge out directory) where each `make`
 * run saves a manifest of the results it produced.
 */
export const MAKE_RESULTS_DIR = 'make-results';

const EXTENSION = '.forge-make.json';

export function getMakeResultsDir(outDir: string): string {
  return path.resolve(outDir, MAKE_RESULTS_DIR);
}

async function listManifests(dir: string): Promise<string[]> {
  return (await fs.readdir(dir))
    .filter((fileName) => fileName.endsWith(EXTENSION))
    .sort()
    .map((fileName) => path.resolve(dir, fileName));
}

/**
 * Reads a manifest, returning `undefined` if it cannot be parsed (e.g. it was
 * truncated by a `make` run that was killed while writing it).
 */
async function readManifest(
  manifest: string,
): Promise<ForgeMakeResult[] | undefined> {
  try {
    const results = await readJson(manifest);
    if (!Array.isArray(results)) {
      throw new Error('manifest is not an array of make results');
    }
    return results;
  } catch (err) {
    d('ignoring unreadable make results manifest %s: %O', manifest, err);
    return undefined;
  }
}

// Write to a temporary file and rename it into place so that a manifest is
// never left half-written if the process dies mid-write.
async function writeManifest(
  manifest: string,
  results: ForgeMakeResult[],
): Promise<void> {
  const tmp = `${manifest}.${process.pid}.tmp`;
  await writeJson(tmp, results, { spaces: 2 });
  await fs.rename(tmp, manifest);
}

/**
 * Whether `previous`, a result saved by an earlier `make` run, is superseded by
 * `next`. Results are matched by platform, arch and maker; a result with no
 * maker name (e.g. one rewritten by a `postMake` hook) is matched by platform
 * and arch alone.
 */
function isSupersededBy(
  previous: ForgeMakeResult,
  next: ForgeMakeResult,
): boolean {
  return (
    previous.platform === next.platform &&
    previous.arch === next.arch &&
    (previous.maker === undefined ||
      next.maker === undefined ||
      previous.maker === next.maker)
  );
}

// Artifact paths are stored relative to the project root, with forward
// slashes, so a manifest written on one machine can be released from
// another (including across operating systems).
function toPortablePath(rootDir: string, artifactPath: string): string {
  return path.relative(rootDir, artifactPath).split(path.sep).join('/');
}

function fromPortablePath(rootDir: string, artifactPath: string): string {
  return path.resolve(rootDir, artifactPath.split(/\/|\\/).join(path.sep));
}

/**
 * Saves the results of a `make` run to `<outDir>/make-results` so that a later
 * `release` with `fromMake` (possibly on a different machine) can release them
 * without rebuilding.
 *
 * Results previously saved for the same platform, arch and maker are removed
 * first, so re-running `make` replaces its own stale output while results made
 * for other platforms, architectures or makers (e.g. by other CI jobs, or by a
 * `make` run with different `--targets`) are kept. Manifests that can no
 * longer be parsed are removed as well.
 *
 * @returns the path of the manifest that was written
 */
export async function saveMakeResults(
  outDir: string,
  results: ForgeMakeResult[],
  rootDir: string,
): Promise<string> {
  const dir = getMakeResultsDir(outDir);
  await fs.mkdir(dir, { recursive: true });

  for (const manifest of await listManifests(dir)) {
    const existing = await readManifest(manifest);
    if (!existing) {
      await fs.rm(manifest);
      continue;
    }
    const kept = existing.filter(
      (previous) => !results.some((next) => isSupersededBy(previous, next)),
    );
    if (kept.length === 0) {
      await fs.rm(manifest);
    } else if (kept.length !== existing.length) {
      await writeManifest(manifest, kept);
    }
  }

  const portableResults = results.map((result) => ({
    ...result,
    artifacts: result.artifacts.map((artifact) =>
      toPortablePath(rootDir, artifact),
    ),
  }));
  const hash = crypto
    .createHash('SHA256')
    .update(JSON.stringify(portableResults))
    .digest('hex');
  const manifest = path.resolve(dir, `${hash}${EXTENSION}`);
  await writeManifest(manifest, portableResults);
  return manifest;
}

/**
 * Loads every manifest saved by {@link saveMakeResults} in `<outDir>/make-results`.
 *
 * @returns one array of results per saved `make` run, with absolute artifact
 * paths resolved against `rootDir`
 */
export async function loadMakeResults(
  outDir: string,
  rootDir: string,
): Promise<ForgeMakeResult[][]> {
  const dir = getMakeResultsDir(outDir);
  const manifests = (await pathExists(dir)) ? await listManifests(dir) : [];

  const makeRuns: ForgeMakeResult[][] = [];
  for (const manifest of manifests) {
    const results = await readManifest(manifest);
    if (!results) {
      throw new Error(
        `The make results manifest ${manifest} could not be read. Run the make command again to regenerate it.`,
      );
    }
    makeRuns.push(
      results.map((result) => ({
        ...result,
        artifacts: result.artifacts.map((artifact) =>
          fromPortablePath(rootDir, artifact),
        ),
      })),
    );
  }

  if (makeRuns.length === 0) {
    throw new Error(
      `No saved make results were found in ${dir}. Run the make command first, and make sure its output is available before releasing with fromMake.`,
    );
  }
  return makeRuns;
}

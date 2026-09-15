import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { pathExists, readJson, writeJson } from '@electron-forge/core-utils';
import { ForgeMakeResult } from '@electron-forge/shared-types';

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

function platformArchKey({ platform, arch }: ForgeMakeResult): string {
  return `${platform}/${arch}`;
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
 * `release` with `skipMake` (possibly on a different machine) can release them
 * without rebuilding.
 *
 * Results previously saved for the same platform/arch combinations are removed
 * first, so re-running `make` replaces its own stale output while results made
 * for other platforms or architectures (e.g. by other CI jobs) are kept.
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

  const replaced = new Set(results.map(platformArchKey));
  for (const manifest of await listManifests(dir)) {
    const existing: ForgeMakeResult[] = await readJson(manifest);
    const kept = existing.filter(
      (result) => !replaced.has(platformArchKey(result)),
    );
    if (kept.length === 0) {
      await fs.rm(manifest);
    } else if (kept.length !== existing.length) {
      await writeJson(manifest, kept, { spaces: 2 });
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
  await writeJson(manifest, portableResults, { spaces: 2 });
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
  if (manifests.length === 0) {
    throw new Error(
      `No saved make results were found in ${dir}. Run the make command first, and make sure its output is available before releasing with skipMake.`,
    );
  }

  const makeRuns: ForgeMakeResult[][] = [];
  for (const manifest of manifests) {
    const results: ForgeMakeResult[] = await readJson(manifest);
    makeRuns.push(
      results.map((result) => ({
        ...result,
        artifacts: result.artifacts.map((artifact) =>
          fromPortablePath(rootDir, artifact),
        ),
      })),
    );
  }
  return makeRuns;
}

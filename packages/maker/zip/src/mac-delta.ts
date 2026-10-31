import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream } from 'node:stream/web';

import { spawn } from '@malept/cross-spawn-promise';

// Squirrel.Mac applies format 3 and 4 patches with any compression but bzip2.
const DELTA_FORMAT_VERSION = '4';
const DELTA_COMPRESSION = 'lzma';

export type FileDigest = {
  sha256: string;
  size: number;
};

export async function digestFile(filePath: string): Promise<FileDigest> {
  const hash = createHash('sha256');
  await pipeline(createReadStream(filePath), hash);
  return { sha256: hash.digest('hex'), size: (await fs.stat(filePath)).size };
}

/**
 * Download `url` to `dest`, checking the SHA-256 and size of the download
 * against `expected` where given.
 */
export async function downloadFile(
  url: string,
  dest: string,
  expected: Partial<FileDigest> = {},
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`);
  }
  const hash = createHash('sha256');
  let size = 0;
  await pipeline(
    Readable.fromWeb(response.body as ReadableStream),
    async function* (source: AsyncIterable<Buffer>) {
      for await (const chunk of source) {
        hash.update(chunk);
        size += chunk.length;
        yield chunk;
      }
    },
    createWriteStream(dest),
  );
  if (expected.size !== undefined && size !== expected.size) {
    throw new Error(
      `Size mismatch for ${url}: expected ${expected.size} bytes, got ${size}`,
    );
  }
  const sha256 = hash.digest('hex');
  if (expected.sha256 && sha256 !== expected.sha256.toLowerCase()) {
    throw new Error(
      `SHA-256 mismatch for ${url}: expected ${expected.sha256}, got ${sha256}`,
    );
  }
}

/**
 * Find the single `.app` bundle in `dir`.
 */
export async function findAppBundle(dir: string): Promise<string> {
  const apps = (await fs.readdir(dir)).filter((name) => name.endsWith('.app'));
  if (apps.length !== 1) {
    throw new Error(
      `Expected exactly one .app bundle in ${dir}, found ${apps.length}`,
    );
  }
  return path.join(dir, apps[0]);
}

export async function readBundleVersion(appPath: string): Promise<string> {
  const version = (
    await spawn('plutil', [
      '-extract',
      'CFBundleVersion',
      'raw',
      '-o',
      '-',
      path.join(appPath, 'Contents', 'Info.plist'),
    ])
  ).trim();
  if (!version) {
    throw new Error(`${appPath} has no CFBundleVersion`);
  }
  return version;
}

/**
 * List the files in `appPath` (relative to its parent) that are group- or
 * other-writable. Symbolic links are skipped, as their modes are not used.
 */
export async function findGroupOrOtherWritable(
  appPath: string,
): Promise<string[]> {
  const entries = ['', ...(await fs.readdir(appPath, { recursive: true }))];
  const writable: string[] = [];
  for (const entry of entries) {
    const stat = await fs.lstat(path.join(appPath, entry));
    if (!stat.isSymbolicLink() && stat.mode & 0o022) {
      writable.push(path.join(path.basename(appPath), entry));
    }
  }
  return writable;
}

/**
 * Return the path to Sparkle's `BinaryDelta`: `configuredPath` if given, or
 * the executable shipped in `@electron-forge/binary-delta`.
 */
export async function getBinaryDelta(configuredPath?: string): Promise<string> {
  if (configuredPath) return configuredPath;

  let binaryDeltaPath: string;
  try {
    ({ binaryDeltaPath } = await import('@electron-forge/binary-delta'));
  } catch (err) {
    throw new Error(
      '@electron-forge/binary-delta is not installed. It is an optional dependency of @electron-forge/maker-zip ' +
        'that only installs on macOS; make sure optional dependencies are installed, or set macUpdateDelta.binaryDeltaPath.',
      { cause: err },
    );
  }
  try {
    await fs.access(binaryDeltaPath, fs.constants.X_OK);
  } catch (err) {
    throw new Error(`${binaryDeltaPath} is missing or not executable`, {
      cause: err,
    });
  }
  return binaryDeltaPath;
}

/**
 * Create a delta from `oldApp` to `newApp` at `deltaPath`, then check that it
 * applies to `oldApp` and yields a validly signed app.
 */
export async function createBinaryDelta(
  binaryDelta: string,
  oldApp: string,
  newApp: string,
  deltaPath: string,
  scratchDir: string,
): Promise<void> {
  await spawn(binaryDelta, [
    'create',
    '--version',
    DELTA_FORMAT_VERSION,
    '--compression',
    DELTA_COMPRESSION,
    oldApp,
    newApp,
    deltaPath,
  ]);

  const patchedApp = path.join(scratchDir, path.basename(newApp));
  await spawn(binaryDelta, ['apply', oldApp, patchedApp, deltaPath]);
  await spawn('codesign', ['--verify', '--deep', '--strict', patchedApp]);
}

/**
 * The release a delta updates from: its signed `.app` bundle, a ZIP of it,
 * or the URL of that ZIP. A downloaded ZIP is checked against `sha256` and
 * `size` where given.
 */
export type MacDeltaSource =
  | { app: string }
  | { zip: string }
  | { url: string; sha256?: string; size?: number };

export interface CreateMacDeltaOptions {
  /**
   * The release users update from, exactly as it was published.
   */
  from: MacDeltaSource;
  /**
   * Path to the signed `.app` bundle of the release users update to.
   */
  to: string;
  /**
   * Path to write the delta to.
   */
  output: string;
  /**
   * Path to a Sparkle `BinaryDelta` executable to use instead of the one
   * in `@electron-forge/binary-delta`.
   */
  binaryDeltaPath?: string;
}

/**
 * The fields of a Squirrel.Mac `delta` manifest entry other than `url`,
 * which depends on where the delta is published.
 */
export interface MacDelta extends FileDigest {
  /**
   * `CFBundleVersion` of the app the delta applies to.
   */
  from_version: string;
}

/**
 * Create a Squirrel.Mac binary delta from one signed release of an app to
 * another, check that it applies and yields a validly signed app, and
 * return its manifest fields. Requires a macOS host.
 *
 * This is the delta step of the ZIP maker's `macUpdateDelta` option, for
 * apps that sign or publish outside Forge, or that offer deltas from more
 * than one earlier release. Unlike the maker, it throws on any failure and
 * leaves no file at `output`.
 */
export async function createMacDelta({
  from,
  to,
  output,
  binaryDeltaPath,
}: CreateMacDeltaOptions): Promise<MacDelta> {
  if (process.platform !== 'darwin') {
    throw new Error('Creating a macOS delta update requires a macOS host');
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'forge-zip-delta-'));
  try {
    let previousApp: string;
    if ('app' in from) {
      previousApp = from.app;
    } else {
      let previousZip: string;
      if ('zip' in from) {
        previousZip = from.zip;
      } else {
        previousZip = path.join(tmpDir, 'previous.zip');
        await downloadFile(from.url, previousZip, {
          sha256: from.sha256,
          size: from.size,
        });
      }
      const previousDir = path.join(tmpDir, 'previous');
      await spawn('ditto', ['-x', '-k', previousZip, previousDir]);
      previousApp = await findAppBundle(previousDir);
    }

    for (const app of [previousApp, to]) {
      const writable = await findGroupOrOtherWritable(app);
      if (writable.length > 0) {
        throw new Error(
          `${app} contains group- or other-writable files, so a delta would stop applying after the first update ` +
            `(Squirrel.Mac removes those permissions on install). Remove them before signing, ` +
            `e.g. with "chmod -R go-w" on the bundle in a packageAfterCopy hook. Files:\n` +
            writable.slice(0, 10).join('\n') +
            (writable.length > 10
              ? `\n...and ${writable.length - 10} more`
              : ''),
        );
      }
    }

    const fromVersion = await readBundleVersion(previousApp);
    const binaryDelta = await getBinaryDelta(binaryDeltaPath);
    await fs.mkdir(path.dirname(output), { recursive: true });
    const scratchDir = path.join(tmpDir, 'check');
    await fs.mkdir(scratchDir);
    await createBinaryDelta(binaryDelta, previousApp, to, output, scratchDir);

    return { from_version: fromVersion, ...(await digestFile(output)) };
  } catch (err) {
    await fs.rm(output, { force: true });
    throw err;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

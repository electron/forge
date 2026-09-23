import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream } from 'node:stream/web';

import { spawn } from '@malept/cross-spawn-promise';

// Squirrel.Mac pins Sparkle at this tag (79bc9e872948e47877e76f194cb0c8e0412b0b90).
const SPARKLE_VERSION = '2.9.5';
const SPARKLE_ARCHIVE_URL = `https://github.com/sparkle-project/Sparkle/releases/download/${SPARKLE_VERSION}/Sparkle-${SPARKLE_VERSION}.tar.xz`;
const SPARKLE_ARCHIVE_SHA256 =
  '015336b601493e05c237964954bff6191370003d94edefe663724c88840d73cc';

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

// Makes for several architectures run concurrently in one process, so they
// share a single download rather than each writing the cache.
const binaryDeltaDownloads = new Map<string, Promise<string>>();

/**
 * Return the path to Sparkle's `BinaryDelta`, downloading and caching it if
 * needed.
 */
export async function getBinaryDelta(binaryDeltaPath?: string) {
  if (binaryDeltaPath) return binaryDeltaPath;

  const cacheDir = path.join(
    os.homedir(),
    'Library',
    'Caches',
    'electron-forge',
    `sparkle-${SPARKLE_VERSION}`,
  );
  const cachedPath = path.join(cacheDir, 'BinaryDelta');
  try {
    await fs.access(cachedPath, fs.constants.X_OK);
    return cachedPath;
  } catch {
    // Not cached yet
  }

  let download = binaryDeltaDownloads.get(cachedPath);
  if (!download) {
    download = downloadBinaryDelta(cacheDir, cachedPath).finally(() =>
      binaryDeltaDownloads.delete(cachedPath),
    );
    binaryDeltaDownloads.set(cachedPath, download);
  }
  return download;
}

async function downloadBinaryDelta(
  cacheDir: string,
  cachedPath: string,
): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'forge-sparkle-'));
  try {
    const archivePath = path.join(tmpDir, path.basename(SPARKLE_ARCHIVE_URL));
    await downloadFile(SPARKLE_ARCHIVE_URL, archivePath, {
      sha256: SPARKLE_ARCHIVE_SHA256,
    });
    await spawn('tar', ['-xf', archivePath, '-C', tmpDir, './bin/BinaryDelta']);
    await fs.mkdir(cacheDir, { recursive: true });
    // Copy to a unique name then rename, so that other processes making at
    // the same time never see or write a partial file
    const partialPath = `${cachedPath}.${randomUUID()}.partial`;
    try {
      await fs.copyFile(path.join(tmpDir, 'bin', 'BinaryDelta'), partialPath);
      await fs.chmod(partialPath, 0o755);
      await fs.rename(partialPath, cachedPath);
    } finally {
      await fs.rm(partialPath, { force: true });
    }
    return cachedPath;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
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

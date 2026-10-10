import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { binaryDeltaPath, SPARKLE_VERSION } from './index.js';

export const SPARKLE_ARCHIVE_URL = `https://github.com/sparkle-project/Sparkle/releases/download/${SPARKLE_VERSION}/Sparkle-${SPARKLE_VERSION}.tar.xz`;
export const SPARKLE_ARCHIVE_SHA256 =
  '015336b601493e05c237964954bff6191370003d94edefe663724c88840d73cc';

/**
 * Download the Sparkle release archive, verify it, and copy its `BinaryDelta`
 * executable and license into `packageDir`. Run when this package is packed
 * for publishing, so that installs never download anything.
 */
export async function fetchBinaryDelta(packageDir: string): Promise<void> {
  const response = await fetch(SPARKLE_ARCHIVE_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${SPARKLE_ARCHIVE_URL}: HTTP ${response.status}`,
    );
  }
  const archive = Buffer.from(await response.arrayBuffer());
  const sha256 = createHash('sha256').update(archive).digest('hex');
  if (sha256 !== SPARKLE_ARCHIVE_SHA256) {
    throw new Error(
      `SHA-256 mismatch for ${SPARKLE_ARCHIVE_URL}: expected ${SPARKLE_ARCHIVE_SHA256}, got ${sha256}`,
    );
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'forge-sparkle-'));
  try {
    const archivePath = path.join(tmpDir, path.basename(SPARKLE_ARCHIVE_URL));
    await fs.writeFile(archivePath, archive);
    await promisify(execFile)('tar', [
      '-xf',
      archivePath,
      '-C',
      tmpDir,
      './bin/BinaryDelta',
      './LICENSE',
    ]);

    const binaryDest = path.resolve(packageDir, 'bin', 'BinaryDelta');
    await fs.mkdir(path.dirname(binaryDest), { recursive: true });
    await fs.copyFile(path.join(tmpDir, 'bin', 'BinaryDelta'), binaryDest);
    await fs.chmod(binaryDest, 0o755);
    await fs.copyFile(
      path.join(tmpDir, 'LICENSE'),
      path.resolve(packageDir, 'SPARKLE-LICENSE'),
    );
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Forge's Verdaccio test setup publishes every package locally and never
  // makes deltas, so it skips the download
  if (process.env.ELECTRON_FORGE_SKIP_BINARY_DELTA_FETCH) {
    console.log('Skipping the BinaryDelta download');
  } else {
    await fetchBinaryDelta(path.resolve(path.dirname(binaryDeltaPath), '..'));
  }
}

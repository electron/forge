import fs from 'node:fs';
import path from 'node:path';

import { ensureTestDirIsNonexistent } from '@electron-forge/test-utils';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { api } from '../../src/api/index';

describe('Make', () => {
  const dir = path.resolve(__dirname, '..', 'fixture', 'default-app');
  let outDir: string;
  let makeDir: string;
  beforeAll(async () => {
    outDir = await ensureTestDirIsNonexistent();
    makeDir = path.join(outDir, 'make');
    await api.package({ dir, outDir });

    return async () => {
      await fs.promises.rm(outDir, { recursive: true, force: true });
    };
  });

  afterEach(async () => {
    await fs.promises.rm(makeDir, { recursive: true, force: true });
  });

  it('can make from custom outDir without errors', async () => {
    await api.make({ dir, skipPackage: true, outDir });

    // out/make/zip/darwin/arm64/Test-App-darwin-arm64-1.0.0.zip
    const artifactPath = path.join(
      outDir,
      'make',
      'zip',
      process.platform,
      process.arch,
      `Test-App-${process.platform}-${process.arch}-1.0.0.zip`,
    );

    expect(fs.existsSync(artifactPath)).toBe(true);

    // spot check that the zip archive is greater than 50MB
    const { size } = await fs.promises.stat(artifactPath);
    expect(size).toBeGreaterThan(50 * 1024 * 1024);
  });

  describe.todo('make with different targets');
});

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchBinaryDelta,
  SPARKLE_ARCHIVE_URL,
} from '../src/fetch-binary-delta';
import { binaryDeltaPath } from '../src/index';

vi.mock(import('node:child_process'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    execFile: vi.fn(),
  };
});

describe('binaryDeltaPath', () => {
  it('should point at the executable in the package', () => {
    expect(binaryDeltaPath).toEqual(
      path.resolve(import.meta.dirname, '..', 'bin', 'BinaryDelta'),
    );
  });
});

describe('fetchBinaryDelta', () => {
  const mockFetch = vi.fn();
  let packageDir: string;

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    packageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-binary-delta-'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fs.rmSync(packageDir, { recursive: true, force: true });
  });

  it('should refuse an archive that does not match the pinned SHA-256', async () => {
    mockFetch.mockResolvedValue(new Response('not sparkle', { status: 200 }));

    await expect(fetchBinaryDelta(packageDir)).rejects.toThrow(
      'SHA-256 mismatch',
    );
    expect(mockFetch).toHaveBeenCalledWith(SPARKLE_ARCHIVE_URL);
    expect(execFile).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(packageDir, 'bin'))).toBe(false);
  });

  it('should fail when the download fails', async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(fetchBinaryDelta(packageDir)).rejects.toThrow('HTTP 404');
  });
});

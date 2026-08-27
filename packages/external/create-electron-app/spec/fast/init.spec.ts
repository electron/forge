import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { installDependencies } from '@electron-forge/core-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { init } from '../../src/init.js';
import { initNPM } from '../../src/init-scripts/init-npm.js';

// Stub out everything that would hit the network. Template files are still
// written to a real temporary directory, since `initializeTemplate` copies them.
vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => ({
  ...(await importOriginal()),
  installDependencies: vi.fn(),
}));

vi.mock(
  import('../../src/init-scripts/init-npm.js'),
  async (importOriginal) => ({
    ...(await importOriginal()),
    initNPM: vi.fn(),
  }),
);

describe('init', () => {
  let dir: string;

  const runInit = () => init({ dir, skipGit: true, interactive: false });

  beforeEach(async () => {
    vi.clearAllMocks();
    dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'forge-init-spec-'));
  });

  afterEach(async () => {
    await fs.promises.rm(dir, { recursive: true, force: true });
  });

  it('should resolve when every dependency install succeeds', async () => {
    await expect(runInit()).resolves.toBeUndefined();
    expect(vi.mocked(initNPM)).toHaveBeenCalled();
  });

  // Regression test: these installs used to be marked `exitOnError: false`, so a
  // failure was swallowed by listr2 and `init` resolved successfully — leaving
  // behind a scaffolded app with missing dependencies and an exit code of 0.
  it('should reject when installing common dependencies fails', async () => {
    vi.mocked(initNPM).mockRejectedValue(new Error('initNPM exploded'));

    await expect(runInit()).rejects.toThrow('initNPM exploded');
  });

  it('should reject when installing template dependencies fails', async () => {
    vi.mocked(installDependencies).mockRejectedValue(
      new Error('registry unreachable'),
    );

    await expect(runInit()).rejects.toThrow('registry unreachable');
  });
});

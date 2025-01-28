import { resolvePackageManager, spawnPackageManager } from '@electron-forge/core-utils';
import { describe, expect, it, vi } from 'vitest';

import { checkPackageManagerVersion } from '../src/util/check-system';

vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    resolvePackageManager: vi.fn(),
    spawnPackageManager: vi.fn(),
  };
});

describe('checkPackageManagerVersion', () => {
  it('should consider allowlisted versions to be valid', async () => {
    vi.mocked(resolvePackageManager).mockResolvedValue({
      executable: 'npm',
      install: 'install',
      dev: '--save-dev',
      exact: '--save-exact',
    });
    vi.mocked(spawnPackageManager).mockResolvedValue('10.9.2');
    await expect(checkPackageManagerVersion()).resolves.not.toThrow();
  });

  it('rejects versions that are outside of the supported range', async () => {
    vi.mocked(resolvePackageManager).mockResolvedValue({
      executable: 'yarn',
      install: 'add',
      dev: '--dev',
      exact: '--exact',
    });

    // yarn 0.x unsupported
    vi.mocked(spawnPackageManager).mockResolvedValue('0.22.0');
    await expect(checkPackageManagerVersion()).rejects.toThrow();
  });

  it('should consider Yarn nightly versions to be invalid', async () => {
    vi.mocked(resolvePackageManager).mockResolvedValue({
      executable: 'yarn',
      install: 'add',
      dev: '--dev',
      exact: '--exact',
    });
    vi.mocked(spawnPackageManager).mockResolvedValue('0.23.0-20170311.0515');
    await expect(checkPackageManagerVersion()).rejects.toThrow();
  });

  it('should consider invalid semver versions to be invalid', async () => {
    vi.mocked(resolvePackageManager).mockResolvedValue({
      executable: 'yarn',
      install: 'add',
      dev: '--dev',
      exact: '--exact',
    });
    vi.mocked(spawnPackageManager).mockResolvedValue('1.22');
    await expect(checkPackageManagerVersion()).rejects.toThrow();
  });
});

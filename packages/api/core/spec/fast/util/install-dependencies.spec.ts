import {
  PACKAGE_MANAGERS,
  spawnPackageManager,
} from '@electron-forge/core-utils';
import { describe, expect, it, vi } from 'vitest';

import {
  DepType,
  DepVersionRestriction,
  installDependencies,
} from '../../../src/util/install-dependencies';

vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    spawnPackageManager: vi.fn(),
  };
});

describe('installDependencies', () => {
  it('should immediately resolve if no deps are provided', async () => {
    await installDependencies(PACKAGE_MANAGERS['npm'], 'mydir', []);
    expect(spawnPackageManager).not.toHaveBeenCalled();
  });

  it('should reject if the package manager fails to spawn', async () => {
    vi.mocked(spawnPackageManager).mockRejectedValueOnce('fail');
    await expect(
      installDependencies(PACKAGE_MANAGERS['npm'], 'void', ['electron']),
    ).rejects.toThrow('fail');
  });

  it('should resolve if the package manager command succeeds', async () => {
    vi.mocked(spawnPackageManager).mockResolvedValueOnce('pass');
    await expect(
      installDependencies(PACKAGE_MANAGERS['npm'], 'void', ['electron']),
    ).resolves.toBe(undefined);
  });

  describe.each([
    PACKAGE_MANAGERS['npm'],
    PACKAGE_MANAGERS['yarn'],
    PACKAGE_MANAGERS['pnpm'],
  ])('$executable', (pm) => {
    it('should install deps', async () => {
      await installDependencies(pm, 'mydir', ['react']);
      expect(spawnPackageManager).toHaveBeenCalledWith(
        pm,
        [pm.install, 'react'],
        expect.anything(),
      );
    });

    it('should install dev deps', async () => {
      await installDependencies(pm, 'mydir', ['eslint'], DepType.DEV);
      expect(spawnPackageManager).toHaveBeenCalledWith(
        pm,
        [pm.install, 'eslint', pm.dev],
        expect.anything(),
      );
    });

    it('should install exact deps', async () => {
      await installDependencies(
        pm,
        'mydir',
        ['react'],
        DepType.PROD,
        DepVersionRestriction.EXACT,
      );
      expect(spawnPackageManager).toHaveBeenCalledWith(
        pm,
        [pm.install, 'react', pm.exact],
        expect.anything(),
      );
    });

    it('should install exact dev deps', async () => {
      await installDependencies(
        pm,
        'mydir',
        ['eslint'],
        DepType.DEV,
        DepVersionRestriction.EXACT,
      );
      expect(spawnPackageManager).toHaveBeenCalledWith(
        pm,
        [pm.install, 'eslint', pm.dev, pm.exact],
        expect.anything(),
      );
    });
  });
});

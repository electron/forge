import {
  DepType,
  DepVersionRestriction,
  installDependencies,
  PACKAGE_MANAGERS,
} from '@electron-forge/core-utils';
import { ForgeListrTask } from '@electron-forge/shared-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deps, devDeps, initNPM } from '../../../src/api/init-scripts/init-npm';

vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => ({
  ...(await importOriginal()),
  installDependencies: vi.fn(),
}));

describe('init-npm', () => {
  const mockTask = {
    output: '',
  } as ForgeListrTask<unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with regular electron version', () => {
    it('should call installDependencies three times with correct parameters', async () => {
      const pm = PACKAGE_MANAGERS['npm'];
      const dir = '/test/dir';

      await initNPM(pm, dir, 'latest', mockTask);
      expect(vi.mocked(installDependencies)).toHaveBeenNthCalledWith(
        1,
        pm,
        dir,
        deps,
      );
      expect(vi.mocked(installDependencies)).toHaveBeenNthCalledWith(
        2,
        pm,
        dir,
        devDeps,
        DepType.DEV,
      );
      expect(vi.mocked(installDependencies)).toHaveBeenNthCalledWith(
        3,
        pm,
        dir,
        ['electron@latest'],
        DepType.DEV,
        DepVersionRestriction.EXACT,
      );
    });
  });

  describe('with `nightly`', () => {
    it('should install electron-nightly@latest instead of electron', async () => {
      const pm = PACKAGE_MANAGERS['npm'];
      const dir = '/test/dir';
      const electronVersion = 'nightly';

      await initNPM(pm, dir, electronVersion, mockTask);

      expect(installDependencies).toHaveBeenCalledTimes(3);
      expect(vi.mocked(installDependencies)).toHaveBeenNthCalledWith(
        3,
        pm,
        dir,
        ['electron-nightly@latest'],
        DepType.DEV,
        DepVersionRestriction.EXACT,
      );
    });
  });
});

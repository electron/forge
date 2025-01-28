import { resolvePackageManager, spawnPackageManager } from '@electron-forge/core-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import installDependencies, { DepType, DepVersionRestriction } from '../../../src/util/install-dependencies';

vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    resolvePackageManager: vi.fn(),
    spawnPackageManager: vi.fn(),
  };
});

describe('installDependencies', () => {
  it('should immediately resolve if no deps are provided', async () => {
    await installDependencies('mydir', []);
    expect(spawnPackageManager).not.toHaveBeenCalled();
  });

  it('should reject if the package manager fails to spawn', async () => {
    vi.mocked(resolvePackageManager).mockResolvedValue({ executable: 'npm', install: 'install', dev: '--save-dev', exact: '--save-exact' });
    vi.mocked(spawnPackageManager).mockRejectedValueOnce('fail');
    await expect(installDependencies('void', ['electron'])).rejects.toThrow('fail');
  });

  it('should resolve if the package manager command succeeds', async () => {
    vi.mocked(resolvePackageManager).mockResolvedValue({ executable: 'npm', install: 'install', dev: '--save-dev', exact: '--save-exact' });
    vi.mocked(spawnPackageManager).mockResolvedValueOnce('pass');
    await expect(installDependencies('void', ['electron'])).resolves.toBe(undefined);
  });

  describe.each([
    { executable: 'npm' as const, install: 'install', exact: '--save-exact', dev: '--save-dev' },
    { executable: 'yarn' as const, install: 'add', exact: '--exact', dev: '--dev' },
    { executable: 'pnpm' as const, install: 'install', exact: '--save-exact', dev: '--save-dev' },
  ])('$executable', (args) => {
    beforeEach(() => {
      vi.mocked(resolvePackageManager).mockResolvedValue(args);
    });

    it('should install deps', async () => {
      await installDependencies('mydir', ['react']);
      expect(spawnPackageManager).toHaveBeenCalledWith([args.install, 'react'], expect.anything());
    });

    it('should install dev deps', async () => {
      await installDependencies('mydir', ['eslint'], DepType.DEV);
      expect(spawnPackageManager).toHaveBeenCalledWith([args.install, 'eslint', args.dev], expect.anything());
    });

    it('should install exact deps', async () => {
      await installDependencies('mydir', ['react'], DepType.PROD, DepVersionRestriction.EXACT);
      expect(spawnPackageManager).toHaveBeenCalledWith([args.install, 'react', args.exact], expect.anything());
    });

    it('should install exact dev deps', async () => {
      await installDependencies('mydir', ['eslint'], DepType.DEV, DepVersionRestriction.EXACT);
      expect(spawnPackageManager).toHaveBeenCalledWith([args.install, 'eslint', args.dev, args.exact], expect.anything());
    });
  });
});

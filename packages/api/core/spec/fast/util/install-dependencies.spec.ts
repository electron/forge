import { hasYarn, yarnOrNpmSpawn } from '@electron-forge/core-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import installDependencies, { DepType, DepVersionRestriction } from '../../../src/util/install-dependencies';

vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    hasYarn: vi.fn(),
    yarnOrNpmSpawn: vi.fn(),
  };
});

describe('installDependencies', () => {
  it('should immediately resolve if no deps are provided', async () => {
    await installDependencies('mydir', []);
    expect(yarnOrNpmSpawn).not.toHaveBeenCalled();
  });

  it('should reject if reject the promise if exit code is not 0', async () => {
    vi.mocked(yarnOrNpmSpawn).mockRejectedValueOnce('fail');
    await expect(installDependencies('void', ['electron'])).rejects.toThrow('fail');
  });

  it('should resolve if reject the promise if exit code is 0', async () => {
    vi.mocked(yarnOrNpmSpawn).mockResolvedValueOnce('pass');
    await expect(installDependencies('void', ['electron'])).resolves.toBe(undefined);
  });

  describe.each([
    { pm: 'npm', install: 'install', flags: { exact: '--save-exact', dev: '--save-dev' } },
    { pm: 'yarn', install: 'add', flags: { exact: '--exact', dev: '--dev' } },
  ])('$pm', ({ pm, install, flags }) => {
    beforeEach(() => {
      vi.mocked(hasYarn).mockResolvedValue(pm === 'yarn');
    });

    it('should install deps', async () => {
      await installDependencies('mydir', ['react']);
      expect(yarnOrNpmSpawn).toHaveBeenCalledWith([install, 'react'], expect.anything());
    });

    it('should install dev deps', async () => {
      await installDependencies('mydir', ['eslint'], DepType.DEV);
      expect(yarnOrNpmSpawn).toHaveBeenCalledWith([install, 'eslint', flags.dev], expect.anything());
    });

    it('should install exact deps', async () => {
      await installDependencies('mydir', ['react'], DepType.PROD, DepVersionRestriction.EXACT);
      expect(yarnOrNpmSpawn).toHaveBeenCalledWith([install, 'react', flags.exact], expect.anything());
    });

    it('should install exact dev deps', async () => {
      await installDependencies('mydir', ['eslint'], DepType.DEV, DepVersionRestriction.EXACT);
      expect(yarnOrNpmSpawn).toHaveBeenCalledWith([install, 'eslint', flags.dev, flags.exact], expect.anything());
    });
  });
});

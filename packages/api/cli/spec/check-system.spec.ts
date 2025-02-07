import { resolvePackageManager, spawnPackageManager } from '@electron-forge/core-utils';
import { describe, expect, it, vi } from 'vitest';

import { checkPackageManager } from '../src/util/check-system';

vi.mock(import('@electron-forge/core-utils'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    resolvePackageManager: vi.fn(),
    spawnPackageManager: vi.fn(),
  };
});

describe('checkPackageManager', () => {
  it('should consider allowlisted versions to be valid', async () => {
    vi.mocked(resolvePackageManager).mockResolvedValue({
      executable: 'npm',
      install: 'install',
      dev: '--save-dev',
      exact: '--save-exact',
    });
    vi.mocked(spawnPackageManager).mockResolvedValue('10.9.2');
    await expect(checkPackageManager()).resolves.not.toThrow();
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
    await expect(checkPackageManager()).rejects.toThrow();
  });

  it('should consider Yarn nightly versions to be invalid', async () => {
    vi.mocked(resolvePackageManager).mockResolvedValue({
      executable: 'yarn',
      install: 'add',
      dev: '--dev',
      exact: '--exact',
    });
    vi.mocked(spawnPackageManager).mockResolvedValue('0.23.0-20170311.0515');
    await expect(checkPackageManager()).rejects.toThrow();
  });

  it('should consider invalid semver versions to be invalid', async () => {
    vi.mocked(resolvePackageManager).mockResolvedValue({
      executable: 'yarn',
      install: 'add',
      dev: '--dev',
      exact: '--exact',
    });
    vi.mocked(spawnPackageManager).mockResolvedValue('1.22');
    await expect(checkPackageManager()).rejects.toThrow();
  });

  it('should throw if using pnpm without node-linker=hoisted or custom hoist-pattern', async () => {
    vi.mocked(resolvePackageManager).mockResolvedValue({
      executable: 'pnpm',
      install: 'add',
      dev: '--dev',
      exact: '--exact',
    });
    vi.mocked(spawnPackageManager).mockImplementation((args) => {
      if (args?.join(' ') === 'config get node-linker') {
        return Promise.resolve('isolated');
      } else if (args?.join(' ') === 'config get hoist-pattern') {
        return Promise.resolve('undefined');
      } else if (args?.join(' ') === 'config get public-hoist-pattern') {
        return Promise.resolve('undefined');
      } else if (args?.join(' ') === '--version') {
        return Promise.resolve('10.0.0');
      } else {
        throw new Error('Unexpected command');
      }
    });
    await expect(checkPackageManager()).rejects.toThrow(
      'When using pnpm, `node-linker` must be set to "hoisted" (or a custom `hoist-pattern` or `public-hoist-pattern` must be defined). Run `pnpm config set node-linker hoisted` to set this config value, or add it to your project\'s `.npmrc` file.'
    );
  });

  it.each(['hoist-pattern', 'public-hoist-pattern'])('should pass without validation if user has set %s in their pnpm config', async (cfg) => {
    vi.mocked(resolvePackageManager).mockResolvedValue({
      executable: 'pnpm',
      install: 'add',
      dev: '--dev',
      exact: '--exact',
    });
    vi.mocked(spawnPackageManager).mockImplementation((args) => {
      if (args?.join(' ') === 'config get node-linker') {
        return Promise.resolve('isolated');
      } else if (args?.join(' ') === `config get ${cfg}`) {
        return Promise.resolve('["*eslint*","*babel*"]');
      } else if (args?.join(' ') === '--version') {
        return Promise.resolve('10.0.0');
      } else {
        return Promise.resolve('undefined');
      }
    });
    await expect(checkPackageManager()).resolves.not.toThrow();
  });

  // resolvePackageManager optionally returns a `version` if `npm_config_user_agent` was used to
  // resolve the package manager being used.
  it('should not shell out to child process if version was already parsed via npm_config_user_agent', async () => {
    vi.mocked(resolvePackageManager).mockResolvedValue({
      executable: 'npm',
      install: 'install',
      dev: '--save-dev',
      exact: '--save-exact',
      version: '10.9.2',
    });
    await expect(checkPackageManager()).resolves.not.toThrow();
    expect(spawnPackageManager).not.toHaveBeenCalled();
  });
});

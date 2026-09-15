import { spawn } from '@malept/cross-spawn-promise';
import findUp from 'find-up';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resolvePackageManager,
  spawnPackageManager,
} from '../src/package-manager';

vi.mock('@malept/cross-spawn-promise');
vi.mock('find-up', async (importOriginal) => {
  const mod = await importOriginal<object>();
  return {
    ...mod,
    default: vi.fn(),
  };
});

describe('package-manager', () => {
  beforeAll(() => {
    const originalUa = process.env.npm_config_user_agent;

    return () => {
      process.env.npm_config_user_agent = originalUa;
    };
  });
  describe('npm_config_user_agent', () => {
    it.each([
      {
        ua: 'yarn/1.22.22 npm/? node/v22.13.0 darwin arm64',
        pm: 'yarn',
        version: '1.22.22',
      },
      {
        ua: 'pnpm/10.0.0 npm/? node/v20.11.1 darwin arm64',
        pm: 'pnpm',
        version: '10.0.0',
      },
      {
        ua: 'npm/10.9.2 node/v22.13.0 darwin arm64 workspaces/false',
        pm: 'npm',
        version: '10.9.2',
      },
    ])('with $ua', async ({ ua, pm, version }) => {
      process.env.npm_config_user_agent = ua;
      await expect(resolvePackageManager()).resolves.toHaveProperty(
        'executable',
        pm,
      );
      await expect(resolvePackageManager()).resolves.toHaveProperty(
        'version',
        version,
      );
    });

    it('should return yarn if npm_config_user_agent=yarn', async () => {
      process.env.npm_config_user_agent =
        'yarn/1.22.22 npm/? node/v22.13.0 darwin arm64';
      await expect(resolvePackageManager()).resolves.toHaveProperty(
        'executable',
        'yarn',
      );
      await expect(resolvePackageManager()).resolves.toHaveProperty(
        'version',
        '1.22.22',
      );
    });

    it('should return pnpm if npm_config_user_agent=pnpm', async () => {
      process.env.npm_config_user_agent =
        'pnpm/10.0.0 npm/? node/v20.11.1 darwin arm64';
      await expect(resolvePackageManager()).resolves.toHaveProperty(
        'executable',
        'pnpm',
      );
    });

    it('should return npm if npm_config_user_agent=npm', async () => {
      process.env.npm_config_user_agent =
        'npm/10.9.2 node/v22.13.0 darwin arm64 workspaces/false';
      await expect(resolvePackageManager()).resolves.toHaveProperty(
        'executable',
        'npm',
      );
    });
  });

  describe('NODE_INSTALLER', () => {
    let initialNodeInstallerValue: string | undefined;

    beforeEach(() => {
      initialNodeInstallerValue = process.env.NODE_INSTALLER;
      delete process.env.NODE_INSTALLER;
      // NODE_INSTALLER is deprecated for Electron Forge 8 and throws a console.warn that we want to silence in tests
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      return () => {
        // For cleanup, we want to restore process.env.NODE_INSTALLER.
        // If it wasn't explicitly set before, we delete the value set during the test.
        // Otherwise, we restore the initial value.
        if (!initialNodeInstallerValue) {
          delete process.env.NODE_INSTALLER;
        } else {
          process.env.NODE_INSTALLER = initialNodeInstallerValue;
        }
        vi.restoreAllMocks();
      };
    });

    it.each([{ pm: 'yarn' }, { pm: 'npm' }, { pm: 'pnpm' }])(
      'should return $pm if NODE_INSTALLER=$pm',
      async ({ pm }) => {
        process.env.NODE_INSTALLER = pm;
        vi.mocked(spawn).mockResolvedValue('9.9.9');
        await expect(resolvePackageManager()).resolves.toHaveProperty(
          'executable',
          pm,
        );
        await expect(resolvePackageManager()).resolves.toHaveProperty(
          'version',
          '9.9.9',
        );
      },
    );

    it('should return npm if package manager is unsupported', async () => {
      process.env.NODE_INSTALLER = 'bun';
      console.warn = vi.fn();
      vi.mocked(spawn).mockResolvedValue('1.22.22');
      await expect(resolvePackageManager()).resolves.toHaveProperty(
        'executable',
        'npm',
      );
      expect(console.warn).toHaveBeenCalledWith(
        '⚠',
        expect.stringContaining('Package manager bun is unsupported'),
      );
    });
  });

  it('should use the package manager for the nearest ancestor lockfile if detected', async () => {
    delete process.env.npm_config_user_agent;
    vi.mocked(findUp).mockResolvedValue('/Users/foo/bar/yarn.lock');
    vi.mocked(spawn).mockResolvedValue('1.22.22');
    await expect(resolvePackageManager()).resolves.toHaveProperty(
      'executable',
      'yarn',
    );
  });

  it('should fall back to npm if no other strategy worked', async () => {
    delete process.env.npm_config_user_agent;
    vi.mocked(findUp).mockResolvedValue(undefined);
    vi.mocked(spawn).mockResolvedValue('9.99.99');
    await expect(resolvePackageManager()).resolves.toHaveProperty(
      'executable',
      'npm',
    );
    await expect(resolvePackageManager()).resolves.toHaveProperty(
      'version',
      '9.99.99',
    );
  });

  describe('spawnPackageManager', () => {
    it('should trim the output', async () => {
      vi.mocked(spawn).mockResolvedValue(' foo \n');
      const result = await spawnPackageManager({
        executable: 'npm',
        install: 'install',
        dev: '--save-dev',
        exact: '--save-exact',
      });
      expect(result).toBe('foo');
    });
  });
});

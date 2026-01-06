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
  describe('resolvePackageManager', () => {
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

    describe('with an explicit package manager passed in', () => {
      beforeEach(() => {
        vi.resetModules();
        delete process.env.npm_config_user_agent;
      });

      it('should accept a string with only the package manager name', async () => {
        const { resolvePackageManager } = await import(
          '../src/package-manager'
        );
        const first = await resolvePackageManager('pnpm');
        expect(first.executable).toBe('pnpm');
        expect(first.version).toBe('latest');
      });

      it('should accept the @latest tag', async () => {
        const { resolvePackageManager } = await import(
          '../src/package-manager'
        );
        const first = await resolvePackageManager('yarn@latest');
        expect(first.executable).toBe('yarn');
        expect(first.version).toBe('latest');
      });

      it('should accept a full version', async () => {
        const { resolvePackageManager } = await import(
          '../src/package-manager'
        );
        const first = await resolvePackageManager('yarn@1.22.22');
        expect(first.executable).toBe('yarn');
        expect(first.version).toBe('1.22.22');
      });

      it('should accept a major.minor version', async () => {
        const { resolvePackageManager } = await import(
          '../src/package-manager'
        );
        const first = await resolvePackageManager('yarn@1.22');
        expect(first.executable).toBe('yarn');
        expect(first.version).toBe('1.22');
      });

      it('should accept a major version', async () => {
        const { resolvePackageManager } = await import(
          '../src/package-manager'
        );
        const first = await resolvePackageManager('yarn@1');
        expect(first.executable).toBe('yarn');
        expect(first.version).toBe('1');
      });

      it('should cache explicit argument and ignore later env / lockfile', async () => {
        const { resolvePackageManager } = await import(
          '../src/package-manager'
        );
        const first = await resolvePackageManager('pnpm@10.0.0');
        expect(first.executable).toBe('pnpm');
        expect(first.version).toBe('10.0.0');

        process.env.npm_config_user_agent =
          'yarn/1.22.22 npm/? node/v22.13.0 darwin arm64';
        vi.mocked(spawn).mockResolvedValue('9.9.9');
        const second = await resolvePackageManager();
        expect(second.executable).toBe('pnpm');
        expect(second.version).toBe('10.0.0');
      });

      it('should fallback to npm and cache when explicit argument unsupported', async () => {
        const { resolvePackageManager } = await import(
          '../src/package-manager'
        );
        vi.mocked(spawn).mockResolvedValue('9.99.99');
        const result = await resolvePackageManager('good coffee');
        expect(result.executable).toBe('npm');
        expect(result.version).toBe('9.99.99');

        const again = await resolvePackageManager();
        expect(again.executable).toBe('npm');
        expect(again.version).toBe('9.99.99');
      });
    });
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

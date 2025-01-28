import { detect } from 'detect-package-manager';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resolvePackageManager } from '../src/package-manager';

describe('package-manager', () => {
  let nodeInstaller: string | undefined;

  beforeEach(() => {
    nodeInstaller = process.env.NODE_INSTALLER;
    delete process.env.NODE_INSTALLER;
  });

  afterEach(() => {
    if (!nodeInstaller) {
      delete process.env.NODE_INSTALLER;
    } else {
      process.env.NODE_INSTALLER = nodeInstaller;
    }
  });

  it('should by default equal the system package manager value', async () => {
    const pm = await detect();
    await expect(resolvePackageManager()).resolves.toHaveProperty('executable', pm);
  });

  it('should return yarn if NODE_INSTALLER=yarn', async () => {
    process.env.NODE_INSTALLER = 'yarn';
    await expect(resolvePackageManager()).resolves.toHaveProperty('executable', 'yarn');
  });

  it('should return npm if NODE_INSTALLER=npm', async () => {
    process.env.NODE_INSTALLER = 'npm';
    await expect(resolvePackageManager()).resolves.toHaveProperty('executable', 'npm');
  });

  it('should return npm if package manager is unsupported', async () => {
    process.env.NODE_INSTALLER = 'bun';
    console.warn = vi.fn();
    await expect(resolvePackageManager()).resolves.toHaveProperty('executable', 'npm');
    expect(console.warn).toHaveBeenCalledWith('⚠', expect.stringContaining('Package manager bun is unsupported'));
  });
});

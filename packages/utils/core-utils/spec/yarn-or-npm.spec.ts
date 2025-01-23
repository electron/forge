import { detect } from 'detect-package-manager';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { safeYarnOrNpm } from '../src/yarn-or-npm';

describe('yarn-or-npm', () => {
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

  it('should by default equal the system yarn-or-npm value', async () => {
    const pm = await detect();
    await expect(safeYarnOrNpm()).resolves.toEqual(pm);
  });

  it('should return yarn if NODE_INSTALLER=yarn', async () => {
    process.env.NODE_INSTALLER = 'yarn';
    await expect(safeYarnOrNpm()).resolves.toEqual('yarn');
  });

  it('should return npm if NODE_INSTALLER=npm', async () => {
    process.env.NODE_INSTALLER = 'npm';
    await expect(safeYarnOrNpm()).resolves.toEqual('npm');
  });

  it('should return system value if NODE_INSTALLER is an unrecognized installer', async () => {
    process.env.NODE_INSTALLER = 'magical_unicorn';
    console.warn = vi.fn();
    const pm = await detect();
    await expect(safeYarnOrNpm()).resolves.toEqual(pm);
    expect(console.warn).toHaveBeenCalledWith('⚠', expect.stringContaining('Unknown NODE_INSTALLER'));
  });
});

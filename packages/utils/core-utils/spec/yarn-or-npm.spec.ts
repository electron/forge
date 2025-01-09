import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import systemYarnOrNpm from 'yarn-or-npm';

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

  it('should by default equal the system yarn-or-npm value', () => {
    expect(safeYarnOrNpm()).toEqual(systemYarnOrNpm());
  });

  it('should return yarn if NODE_INSTALLER=yarn', () => {
    process.env.NODE_INSTALLER = 'yarn';
    expect(safeYarnOrNpm()).toEqual('yarn');
  });

  it('should return npm if NODE_INSTALLER=npm', () => {
    process.env.NODE_INSTALLER = 'npm';
    expect(safeYarnOrNpm()).toEqual('npm');
  });

  it('should return system value if NODE_INSTALLER is an unrecognized installer', () => {
    process.env.NODE_INSTALLER = 'magical_unicorn';
    console.warn = vi.fn();
    expect(safeYarnOrNpm()).toEqual(systemYarnOrNpm());
    expect(console.warn).toHaveBeenCalledWith('⚠', expect.stringContaining('Unknown NODE_INSTALLER'));
  });
});

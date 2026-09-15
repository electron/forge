import { api } from '@electron-forge/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockElectronProcess = vi.hoisted(() => ({
  on: vi.fn((event: string, cb: (code: number) => void) => {
    if (event === 'exit') cb(0);
  }),
  removeListener: vi.fn(),
  restarted: false,
}));

vi.mock(import('@electron-forge/core'), async () => {
  return {
    api: {
      start: vi.fn().mockResolvedValue(mockElectronProcess),
    },
  };
});

vi.mock(import('../src/util/terminate'), () => ({}));

describe('electron-forge-start', () => {
  const originalArgv = process.argv;
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    vi.resetModules();
    process.argv = ['node', 'electron-forge-start.js'];
    originalIsTTY = process.stdin.isTTY;
  });

  afterEach(() => {
    vi.resetModules();
    process.argv = originalArgv;
    Object.defineProperty(process.stdin, 'isTTY', {
      value: originalIsTTY,
      configurable: true,
    });
  });

  it('sets interactive to false when stdin is not a TTY', async () => {
    Object.defineProperty(process.stdin, 'isTTY', {
      value: undefined,
      configurable: true,
    });
    await import('../src/electron-forge-start');
    expect(vi.mocked(api.start)).toHaveBeenCalledWith(
      expect.objectContaining({ interactive: false }),
    );
  });

  it('sets interactive to true when stdin is a TTY', async () => {
    Object.defineProperty(process.stdin, 'isTTY', {
      value: true,
      configurable: true,
    });
    await import('../src/electron-forge-start');
    expect(vi.mocked(api.start)).toHaveBeenCalledWith(
      expect.objectContaining({ interactive: true }),
    );
  });

  it('passes args after -- to the Electron app', async () => {
    process.argv = ['node', 'electron-forge-start.js', '--', '--foo', 'bar'];
    await import('../src/electron-forge-start');
    expect(vi.mocked(api.start)).toHaveBeenCalledWith(
      expect.objectContaining({ args: ['--foo', 'bar'] }),
    );
  });
});

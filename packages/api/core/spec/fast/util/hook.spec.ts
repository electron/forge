import { ForgeHookFn, ResolvedForgeConfig } from '@electron-forge/shared-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runHook, runMutatingHook } from '../../../src/util/hook';

const fakeConfig = {
  pluginInterface: {
    triggerHook: vi.fn(),
    triggerMutatingHook: vi.fn(),
  },
} as unknown as ResolvedForgeConfig;

describe('runHook', () => {
  it('should not error when running non existent hooks', async () => {
    await runHook({ ...fakeConfig }, 'preMake');
  });

  it('should not error when running a hook that is not a function', async () => {
    await runHook({ hooks: { preMake: 'abc' as unknown as ForgeHookFn<'preMake'> }, ...fakeConfig }, 'preMake');
  });

  it('should run the hook if it is provided as a function', async () => {
    const fn = vi.fn();
    fn.mockResolvedValue('beep-boop');
    await runHook({ hooks: { preMake: fn }, ...fakeConfig }, 'preMake');
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe('runMutatingHook', () => {
  beforeEach(() => {
    vi.mocked(fakeConfig.pluginInterface.triggerMutatingHook).mockImplementation((_, arg1) => Promise.resolve(arg1));
  });

  it('should return the input when running non existent hooks', async () => {
    const info = {
      foo: 'bar',
    };
    expect(await runMutatingHook({ ...fakeConfig }, 'readPackageJson', info)).toEqual(info);
  });

  it('should return the mutated input when returned from a hook', async () => {
    const fn = vi.fn();
    fn.mockResolvedValue({
      mutated: 'foo',
    });
    const info = {
      foo: 'bar',
    };
    const output = await runMutatingHook({ hooks: { readPackageJson: fn }, ...fakeConfig }, 'readPackageJson', info);
    expect(output).toEqual({
      mutated: 'foo',
    });
    expect(vi.mocked(fakeConfig.pluginInterface.triggerMutatingHook).mock.lastCall).toEqual([
      'readPackageJson',
      {
        mutated: 'foo',
      },
    ]);
  });
});

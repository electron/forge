import { ForgeHookFn, ResolvedForgeConfig } from '@electron-forge/shared-types';
import { describe, expect, it, vi } from 'vitest';

import {
  getHookListrTasks,
  runHook,
  runMutatingHook,
} from '../../../src/util/hook.js';

const fakeConfig = {
  pluginInterface: {
    triggerHook: vi.fn(),
    triggerMutatingHook: vi.fn(),
  },
} as unknown as ResolvedForgeConfig;

vi.mocked(fakeConfig.pluginInterface.triggerMutatingHook).mockImplementation(
  (_, arg1) => Promise.resolve(arg1),
);

describe('runHook', () => {
  it('should not error when running non existent hooks', async () => {
    await runHook({ ...fakeConfig }, 'preMake');
  });

  it('should not error when running a hook that is not a function', async () => {
    await runHook(
      {
        hooks: { preMake: 'abc' as unknown as ForgeHookFn<'preMake'> },
        ...fakeConfig,
      },
      'preMake',
    );
  });

  it('should run the hook if it is provided as a function', async () => {
    const fn = vi.fn();
    fn.mockResolvedValue('beep-boop');
    await runHook({ hooks: { preMake: fn }, ...fakeConfig }, 'preMake');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should pass null as the task parameter when running outside listr', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    await runHook({ hooks: { preMake: fn }, ...fakeConfig }, 'preMake');
    expect(fn).toHaveBeenCalledWith(expect.anything(), null);
  });
});

describe('getHookListrTasks', () => {
  // A minimal mock of childTrace that preserves the (childTrace, ctx, task) => ... calling convention
  const fakeChildTrace: any = (_opts: any, fn: any) => {
    return (...args: any[]) => fn(fakeChildTrace, ...args);
  };

  it('should pass the listr task to the hook function', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const config = {
      ...fakeConfig,
      hooks: { generateAssets: fn },
      pluginInterface: {
        ...fakeConfig.pluginInterface,
        getHookListrTasks: vi.fn().mockResolvedValue([]),
      },
    } as unknown as ResolvedForgeConfig;

    const tasks = await getHookListrTasks(
      fakeChildTrace,
      config,
      'generateAssets',
      'darwin',
      'x64',
    );

    expect(tasks).toHaveLength(1);

    const fakeTask = { output: '' };
    await (tasks[0].task as any)({}, fakeTask);

    expect(fn).toHaveBeenCalledWith(config, 'darwin', 'x64', fakeTask);
  });
});

describe('runMutatingHook', () => {
  it('should return the input when running non existent hooks', async () => {
    const info = {
      foo: 'bar',
    };
    expect(
      await runMutatingHook({ ...fakeConfig }, 'readPackageJson', info),
    ).toEqual(info);
  });

  it('should return the mutated input when returned from a hook', async () => {
    const fn = vi.fn();
    fn.mockResolvedValue({
      mutated: 'foo',
    });
    const info = {
      foo: 'bar',
    };
    const output = await runMutatingHook(
      { hooks: { readPackageJson: fn }, ...fakeConfig },
      'readPackageJson',
      info,
    );
    expect(output).toEqual({
      mutated: 'foo',
    });
    expect(
      vi.mocked(fakeConfig.pluginInterface.triggerMutatingHook).mock.lastCall,
    ).toEqual([
      'readPackageJson',
      {
        mutated: 'foo',
      },
    ]);
  });
});

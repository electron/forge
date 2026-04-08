import {
  ForgeHookFn,
  ForgeHookName,
  ForgeListrTask,
} from '@electron-forge/shared-types';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Wraps a hook function to receive the Listr2 task object as the first argument,
 * enabling `task.output` and `task.title` updates from within the hook. Also sets
 * a custom display name for the task in the Listr2 renderer.
 *
 * @example
 * ```ts
 * import { createHookWithTask } from '@electron-forge/core-utils';
 *
 * export default {
 *   hooks: {
 *     prePackage: createHookWithTask(async (task, config, platform, arch) => {
 *       task.title = 'Preparing native modules';
 *       task.output = 'Compiling...';
 *     }, 'Custom prePackage step'),
 *   },
 * };
 * ```
 */
export const createHookWithTask = <Hook extends ForgeHookName>(
  hookFn: <Ctx = never>(
    task: ForgeListrTask<Ctx> | null,
    ...args: Parameters<ForgeHookFn<Hook>>
  ) => ReturnType<ForgeHookFn<Hook>>,
  name: string,
): ForgeHookFn<Hook> => {
  function namedHookWithTaskInner(
    this: ForgeListrTask<any> | null,
    ...args: any[]
  ) {
    return (hookFn as any)(this, ...args);
  }
  const fn = namedHookWithTaskInner as any;
  fn.__hookName = name;
  return fn;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

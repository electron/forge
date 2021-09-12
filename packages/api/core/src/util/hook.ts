import { ForgeConfig } from '@electron-forge/shared-types';
import debug from 'debug';

const d = debug('electron-forge:hook');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const runHook = async (forgeConfig: ForgeConfig, hookName: string, ...hookArgs: any[]): Promise<void> => {
  const { hooks } = forgeConfig;
  if (hooks) {
    d(`hook triggered: ${hookName}`);
    if (typeof hooks[hookName] === 'function') {
      d('calling hook:', hookName, 'with args:', hookArgs);
      await hooks[hookName](forgeConfig, ...hookArgs);
    }
  }
  await forgeConfig.pluginInterface.triggerHook(hookName, hookArgs);
};

export async function runMutatingHook<T>(forgeConfig: ForgeConfig, hookName: string, item: T): Promise<T> {
  const { hooks } = forgeConfig;
  if (hooks) {
    d(`hook triggered: ${hookName}`);
    if (typeof hooks[hookName] === 'function') {
      d('calling mutating hook:', hookName, 'with item:', item);
      const result = await hooks[hookName](forgeConfig, item);
      if (typeof result !== 'undefined') {
        item = result;
      }
    }
  }
  return forgeConfig.pluginInterface.triggerMutatingHook(hookName, item);
}

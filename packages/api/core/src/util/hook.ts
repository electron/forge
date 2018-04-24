import { ForgeConfig } from '@electron-forge/shared-types';
import debug from 'debug';

const d = debug('electron-forge:hook');

export default async (forgeConfig: ForgeConfig, hookName: string, ...hookArgs: any[]) => {
  const hooks = forgeConfig.hooks;
  if (hooks) {
    d(`hook triggered: ${hookName}`);
    if (typeof hooks[hookName] === 'function') {
      d('calling hook:', hookName, 'with args:', hookArgs);
      await hooks[hookName](forgeConfig, ...hookArgs);
    }
  }
  await forgeConfig.pluginInterface.triggerHook(hookName, hookArgs);
};

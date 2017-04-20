import debug from 'debug';

const d = debug('electron-forge:hook');

export default async (forgeConfig, hookName, ...hookArgs) => {
  const hooks = forgeConfig.hooks || {};
  if (typeof hooks[hookName] === 'function') {
    d('calling hook:', hookName, 'with args:', hookArgs);
    await hooks[hookName](forgeConfig, ...hookArgs);
  } else {
    d('could not find hook:', hookName);
  }
};

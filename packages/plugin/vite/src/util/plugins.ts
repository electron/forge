import { builtinModules } from 'node:module';

import type { VitePluginBuildConfig } from '../Config';
import type { Plugin } from 'vite';

/**
 * `electron` and Node.js built-in modules should always be externalize.
 */
export function externalBuiltins() {
  return <Plugin>{
    name: '@electron-forge/plugin-vite:external-builtins',
    config(config) {
      const nativeModules = builtinModules.filter((e) => !e.startsWith('_'));
      const builtins = ['electron', ...nativeModules, ...nativeModules.map((m) => `node:${m}`)];

      config.build ??= {};
      config.build.rollupOptions ??= {};

      let external = config.build.rollupOptions.external;
      if (Array.isArray(external) || typeof external === 'string' || external instanceof RegExp) {
        external = builtins.concat(external as string[]);
      } else if (typeof external === 'function') {
        const original = external;
        external = function (source, importer, isResolved) {
          if (builtins.includes(source)) {
            return true;
          }
          return original(source, importer, isResolved);
        };
      } else {
        external = builtins;
      }
      config.build.rollupOptions.external = external;
    },
  };
}

/**
 * Hot restart App during development for better DX.
 */
export function hotRestart(config: VitePluginBuildConfig) {
  const restart = () => {
    // https://github.com/electron/forge/blob/v6.1.1/packages/api/core/src/api/start.ts#L204-L211
    process.stdin.emit('data', 'rs');
  };
  // Avoid first start, it's stated by forge.
  let isFirstStart: undefined | true;

  return <Plugin>{
    name: '@electron-forge/plugin-vite:hot-restart',
    closeBundle() {
      if (isFirstStart == null) {
        isFirstStart = true;
        return;
      }
      if (config.restart === false) {
        return;
      }
      if (typeof config.restart === 'function') {
        // Leave it to the user to decide whether to restart.
        config.restart(restart);
      } else {
        restart();
      }
    },
  };
}

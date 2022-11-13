import { builtinModules } from 'node:module';

import type { Plugin } from 'vite';

/**
 * `electron` and Node.js built-in modules should always be externalize.
 */
export function externalBuiltins() {
  return <Plugin>{
    name: '@electron-forge/plugin-vite:external-builtins',
    config(config) {
      const builtins = [
        'electron',
        ...builtinModules.filter((e) => !e.startsWith('_')),
        ...builtinModules.filter((e) => !e.startsWith('_')).map((m) => `node:${m}`),
      ];

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

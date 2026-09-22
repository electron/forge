import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import {
  external,
  getBuildConfig,
  pluginHotRestart,
} from './vite.base.config.js';

export function getConfig(
  forgeEnv: ConfigEnv<'build'>,
  userConfig: UserConfig = {},
): UserConfig {
  const { forgeConfigSelf } = forgeEnv;
  const config: UserConfig = {
    build: {
      copyPublicDir: false,
      // Preload scripts are CommonJS modules with the Node API available, not
      // browser bundles. Flagging the build as SSR switches Vite to its `ssr`
      // environment, so it stops emitting browser-only code such as module
      // preload helpers and `self` references.
      // See https://github.com/electron/forge/issues/3439.
      ssr: true,
      // Preload scripts may contain Web assets, and the `ssr` environment
      // does not emit assets by default.
      ssrEmitAssets: true,
      // Node has no module preloading, so never inject the polyfill.
      modulePreload: false,
      rollupOptions: {
        external: [...external, 'electron/renderer'],
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: forgeConfigSelf.entry,
        output: {
          format: 'cjs',
          // Preload scripts require a single entrypoint.
          codeSplitting: false,
          entryFileNames: '[name].cjs',
          chunkFileNames: '[name].cjs',
          assetFileNames: '[name].[ext]',
        },
      },
    },
    plugins: [pluginHotRestart('reload')],
    define: {
      // Pin `process.env` to itself so a Node bundle can never end up with
      // build-time environment values baked in. Vite 8 already leaves it
      // alone in the `ssr` environment, so these are a no-op today; they exist
      // so that stays true.
      'process.env': 'process.env',
      'global.process.env': 'global.process.env',
      'globalThis.process.env': 'globalThis.process.env',
    },
    ssr: {
      // Forge bundles everything but `electron` and Node builtins, which are
      // listed in `build.rollupOptions.external` instead.
      noExternal: true,
      // Preload scripts are a hybrid environment: they have Node available,
      // but they are loaded into a renderer and routinely pull in packages
      // written for the browser. Vite's `ssr` environment resolves Node-first
      // by default, so override it with the browser-first lists Vite uses for
      // its `client` environment. Only these resolver options are overridden;
      // `ssr.resolve.externalConditions` applies to dependencies left
      // external, and the externals above never reach Vite's resolver. The
      // top-level `resolve.conditions` is not set alongside, because it only
      // configures the `client` environment, which `build.ssr` bypasses.
      resolve: {
        conditions: ['module', 'browser', 'development|production'],
        mainFields: ['browser', 'module', 'jsnext:main', 'jsnext'],
      },
    },
  };
  const buildConfig = getBuildConfig(forgeEnv);

  return mergeConfig(mergeConfig(buildConfig, config), userConfig);
}

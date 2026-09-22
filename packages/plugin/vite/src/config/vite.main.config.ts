import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import {
  external,
  getBuildConfig,
  getBuildDefine,
  pluginHotRestart,
} from './vite.base.config.js';

export function getConfig(
  forgeEnv: ConfigEnv<'build'>,
  userConfig: UserConfig = {},
): UserConfig {
  const { forgeConfigSelf } = forgeEnv;
  const define = getBuildDefine(forgeEnv);
  const config: UserConfig = {
    build: {
      copyPublicDir: false,
      // The main process is Node, not a browser. Flagging the build as SSR
      // switches Vite to its `ssr` environment, so it stops emitting
      // browser-only code such as module preload helpers and `self`
      // references. See https://github.com/electron/forge/issues/3439.
      ssr: true,
      // The `ssr` environment does not emit assets by default, but a main
      // entry that imports one still needs the file written to disk.
      ssrEmitAssets: true,
      // Node has no module preloading, so never inject the polyfill.
      modulePreload: false,
      rollupOptions: {
        external: [...external, 'electron/main'],
      },
    },
    plugins: [
      ...(forgeEnv.forgeConfig.hotRestart ? [pluginHotRestart('restart')] : []),
    ],
    define: {
      // Pin `process.env` to itself so a Node bundle can never end up with
      // build-time environment values baked in. Vite 8 already leaves it
      // alone in the `ssr` environment, so these are a no-op today; they exist
      // so that stays true. Forge's own defines are spread last so they win.
      'process.env': 'process.env',
      'global.process.env': 'global.process.env',
      'globalThis.process.env': 'globalThis.process.env',
      ...define,
    },
    ssr: {
      // Forge bundles everything but `electron` and Node builtins, which are
      // listed in `build.rollupOptions.external` instead.
      noExternal: true,
      // Resolution is deliberately left to the `ssr` environment's defaults:
      // they are already the Node-first lists this config used to spell out
      // by hand — conditions `['module', 'node', 'development|production']`
      // and main fields `['module', 'jsnext:main', 'jsnext']`. The top-level
      // `resolve.conditions` would be dead config here, because it only
      // configures the `client` environment. `ssr.resolve.externalConditions`
      // likewise does not apply: it only affects dependencies left external,
      // and the externals above never reach Vite's resolver.
    },
  };
  const buildConfig = getBuildConfig(forgeEnv);

  if (userConfig.build?.lib == null) {
    config.build!.lib = {
      entry: forgeConfigSelf.entry,
      fileName: () => '[name].cjs',
      formats: ['cjs'],
    };
  }

  return mergeConfig(mergeConfig(buildConfig, config), userConfig);
}

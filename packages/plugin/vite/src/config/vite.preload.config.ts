import {
  type ConfigEnv,
  defaultClientConditions,
  defaultClientMainFields,
  mergeConfig,
  type UserConfig,
} from 'vite';

import {
  carryResolveToSsr,
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
      // Keep `process.env` a runtime read (a no-op on Vite 8, kept as insurance).
      'process.env': 'process.env',
      'global.process.env': 'global.process.env',
      'globalThis.process.env': 'globalThis.process.env',
      // The `ssr` environment keeps `process.env.NODE_ENV` as a runtime read,
      // but browser-oriented dependencies in a preload rely on it being
      // inlined to drop their development builds, as the old browser build
      // did.
      'process.env.NODE_ENV': JSON.stringify(forgeEnv.mode),
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
      // external, and the externals above never reach Vite's resolver. A
      // user's top-level `resolve` options are carried over by
      // `carryResolveToSsr` below.
      resolve: {
        conditions: [...defaultClientConditions],
        mainFields: [...defaultClientMainFields],
      },
    },
  };
  carryResolveToSsr(config, userConfig);

  // A sandboxed preload (Electron's default) has no `__filename` or
  // `__dirname`, so lowering `import.meta` to them would throw there. Keep the
  // values the old browser build gave (`undefined`) in that case. An ES module
  // preload keeps its native `import.meta`, so leave it alone.
  const userOutput = userConfig.build?.rollupOptions?.output;
  const userFormat = Array.isArray(userOutput)
    ? userOutput.map((output) => output.format)
    : [userOutput?.format];
  if (
    userFormat.every(
      (format) => format == null || format === 'cjs' || format === 'commonjs',
    )
  ) {
    Object.assign(config.define!, {
      'import.meta.url':
        '(typeof __filename === "string" ? require("url").pathToFileURL(__filename).href : undefined)',
      'import.meta.filename':
        '(typeof __filename === "string" ? __filename : undefined)',
      'import.meta.dirname':
        '(typeof __dirname === "string" ? __dirname : undefined)',
    });
  }
  const buildConfig = getBuildConfig(forgeEnv);

  return mergeConfig(mergeConfig(buildConfig, config), userConfig);
}

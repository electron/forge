import fs from 'node:fs';
import path from 'node:path';

import {
  type ConfigEnv,
  type LibraryOptions,
  mergeConfig,
  type UserConfig,
} from 'vite';

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
      // Keep `process.env` a runtime read (a no-op on Vite 8, kept as
      // insurance). Forge's own defines are spread last so they win.
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

  // An SSR build ignores `lib.fileName` and names entries `[name].js` or
  // `[name].cjs` from the nearest package.json's `type`, so a CommonJS project
  // would get `main.js` where its `main` field expects `main.cjs`. Name the
  // entry the way a library build would, unless the user names it directly.
  const lib = userConfig.build?.lib ?? config.build!.lib;
  const userOutput = userConfig.build?.rollupOptions?.output;
  if (lib && !Array.isArray(userOutput) && userOutput?.entryFileNames == null) {
    config.build!.rollupOptions!.output = {
      entryFileNames: libEntryFileNames(lib, forgeEnv.root),
    };
  }

  return mergeConfig(mergeConfig(buildConfig, config), userConfig);
}

/**
 * Mirrors how Vite names a library build's entry file, which an SSR build
 * otherwise skips. Only the first format is named, since Forge emits one.
 */
function libEntryFileNames(lib: LibraryOptions, root: string) {
  const format = lib.formats?.[0] ?? 'es';
  return ({ name }: { name: string }) => {
    if (typeof lib.fileName === 'function') return lib.fileName(format, name);
    const pkgName = findPackageJson(root, (pkg) => !!pkg.name)?.name;
    const base =
      lib.fileName ??
      (pkgName && typeof lib.entry === 'string'
        ? pkgName.replace(/^@[^/]+\//, '')
        : name);
    const type = findPackageJson(root, () => true)?.type;
    const ext =
      type === 'module'
        ? format === 'cjs' || format === 'umd'
          ? 'cjs'
          : 'js'
        : format === 'es'
          ? 'mjs'
          : 'js';
    return format === 'cjs' || format === 'es'
      ? `${base}.${ext}`
      : `${base}.${format}.${ext}`;
  };
}

function findPackageJson(
  dir: string,
  match: (pkg: { name?: string; type?: string }) => boolean,
): { name?: string; type?: string } | undefined {
  for (let current = dir; ; current = path.dirname(current)) {
    const file = path.join(current, 'package.json');
    if (fs.existsSync(file)) {
      const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (match(pkg)) return pkg;
    }
    if (path.dirname(current) === current) return undefined;
  }
}

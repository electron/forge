import fs from 'node:fs';
import path from 'node:path';

import {
  type ConfigEnv,
  type LibraryOptions,
  mergeConfig,
  type Plugin,
  type Rollup,
  type UserConfig,
} from 'vite';

import {
  carryResolveToSsr,
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
      // by hand. A user's top-level `resolve` options only configure the
      // `client` environment, so `carryResolveToSsr` below copies them here.
      // `ssr.resolve.externalConditions` does not apply: it only affects
      // dependencies left external, and the externals above never reach
      // Vite's resolver.
    },
  };
  // Forge used to set these Node-first lists on the top-level `resolve`, and
  // Vite appended a user's own lists to them.
  carryResolveToSsr(config, userConfig, {
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  });
  const buildConfig = getBuildConfig(forgeEnv);

  if (userConfig.build?.lib == null) {
    config.build!.lib = {
      entry: forgeConfigSelf.entry,
      fileName: () => '[name].cjs',
      formats: ['cjs'],
    };
  }

  const lib = userConfig.build?.lib ?? config.build!.lib;
  if (lib) {
    config.plugins!.push(
      pluginLibEntryNames(
        lib,
        forgeEnv.root,
        userConfig.build?.rollupOptions?.output,
      ),
    );
  }

  return mergeConfig(mergeConfig(buildConfig, config), userConfig);
}

type LibFormat = NonNullable<LibraryOptions['formats']>[number];

/**
 * An SSR build ignores `lib.fileName` and names entries `[name].js` or
 * `[name].cjs` from the nearest package.json's `type`, so a CommonJS project
 * would get `main.js` where its `main` field expects `main.cjs`. Name each
 * output's entry the way a library build would for that output's format,
 * unless the user names it directly.
 */
function pluginLibEntryNames(
  lib: LibraryOptions,
  root: string,
  userOutput: Rollup.OutputOptions | Rollup.OutputOptions[] | undefined,
): Plugin {
  const userNamed = (format: LibFormat) =>
    Array.isArray(userOutput)
      ? userOutput.some(
          (output) =>
            output.entryFileNames != null &&
            normalizeFormat(output.format) === format,
        )
      : userOutput?.entryFileNames != null;

  return {
    name: '@electron-forge/plugin-vite:lib-entry-names',
    outputOptions(options) {
      const format = normalizeFormat(options.format);
      if (userNamed(format)) return null;
      return {
        ...options,
        entryFileNames: ({ name }) => libEntryFileName(lib, format, name, root),
      };
    },
  };
}

function normalizeFormat(format: string | undefined): LibFormat {
  if (format === undefined || format === 'esm' || format === 'module') {
    return 'es';
  }
  return format === 'commonjs' ? 'cjs' : (format as LibFormat);
}

/** Mirrors Vite's own naming of a library build's entry file. */
function libEntryFileName(
  lib: LibraryOptions,
  format: LibFormat,
  name: string,
  root: string,
) {
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

import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import debug from 'debug';
import webpack from 'webpack';

const d = debug('electron-forge:plugin:webpack:bundler');

/**
 * The bundlers that the plugin can drive.
 */
export type BundlerName = 'webpack' | 'rspack';

/**
 * The subset of the bundler API that the plugin uses.
 *
 * Rspack mirrors these webpack exports, so both bundlers are typed against
 * webpack's definitions.
 */
export interface Bundler {
  name: BundlerName;
  compile: typeof webpack;
  DefinePlugin: typeof webpack.DefinePlugin;
  ExternalsPlugin: typeof webpack.ExternalsPlugin;
}

const RSPACK_PACKAGE = '@rspack/core';

const webpackBundler: Bundler = {
  name: 'webpack',
  compile: webpack,
  DefinePlugin: webpack.DefinePlugin,
  ExternalsPlugin: webpack.ExternalsPlugin,
};

type RspackModule = {
  rspack: typeof webpack;
  DefinePlugin: typeof webpack.DefinePlugin;
  ExternalsPlugin: typeof webpack.ExternalsPlugin;
};

async function importRspack(projectDir: string): Promise<RspackModule> {
  // `@rspack/core` is an optional peer dependency, so it is installed by the
  // app rather than by this plugin. Resolve it from the plugin first (which
  // works for hoisted installs and for pnpm's peer linking), then from the
  // app's own `node_modules`.
  const candidates: (() => string)[] = [
    () => RSPACK_PACKAGE,
    () =>
      pathToFileURL(
        createRequire(path.resolve(projectDir, 'package.json')).resolve(
          RSPACK_PACKAGE,
        ),
      ).toString(),
  ];

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const specifier = candidate();
      d('trying to import rspack from', specifier);
      const mod = await import(specifier);
      return (mod.rspack ? mod : mod.default) as RspackModule;
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    `The webpack plugin is configured with \`bundler: 'rspack'\`, but "${RSPACK_PACKAGE}" could not be loaded. Install it in your app with your package manager (for example \`npm install --save-dev ${RSPACK_PACKAGE}\`).`,
    { cause: lastError },
  );
}

const cache = new Map<string, Promise<Bundler>>();

/**
 * Load the bundler named by the plugin config.
 *
 * webpack is a regular dependency of the plugin. Rspack is only loaded when it
 * is asked for, and only from an install the app made itself.
 */
export function loadBundler(
  name: BundlerName | undefined,
  projectDir: string,
): Promise<Bundler> {
  const bundlerName = name ?? 'webpack';
  if (bundlerName === 'webpack') return Promise.resolve(webpackBundler);
  if (bundlerName !== 'rspack') {
    return Promise.reject(
      new Error(
        `Unknown bundler ${JSON.stringify(name)} in the webpack plugin config. Use 'webpack' or 'rspack'.`,
      ),
    );
  }

  const key = `${bundlerName}:${projectDir}`;
  let bundler = cache.get(key);
  if (!bundler) {
    bundler = importRspack(projectDir).then((rspack) => ({
      name: 'rspack',
      compile: rspack.rspack,
      DefinePlugin: rspack.DefinePlugin,
      ExternalsPlugin: rspack.ExternalsPlugin,
    }));
    // Let a later call retry if the import failed, for example after the
    // user installs the package.
    bundler.catch(() => cache.delete(key));
    cache.set(key, bundler);
  }
  return bundler;
}

import fs from 'node:fs';
import { createRequire, isBuiltin } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import * as esbuild from 'esbuild';

const REQUIRE_SHIM_NAMESPACE = 'electron-forge-external-require';
const RESOLVE_SKIP_MARKER = 'electron-forge-externalize-skip';

/**
 * Determines whether a bare specifier resolves to an ES module (as opposed to
 * CommonJS), using Node's own resolution rules from the config's directory.
 */
function specifierIsESM(specifier: string, resolveDir: string): boolean {
  const req = createRequire(path.join(resolveDir, 'noop.js'));
  let resolved: string;
  try {
    resolved = req.resolve(specifier);
  } catch {
    // Not require()-able (e.g. an "exports" map without a "require"
    // condition), so it can only be loaded as ESM.
    return true;
  }
  if (resolved.endsWith('.mjs')) {
    return true;
  }
  if (!resolved.endsWith('.js')) {
    // .cjs, .json, .node
    return false;
  }
  // For .js files the format comes from the nearest package.json "type"
  let dir = path.dirname(resolved);
  for (;;) {
    const packageJsonPath = path.join(dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        return (
          JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).type === 'module'
        );
      } catch {
        return false;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return false;
    }
    dir = parent;
  }
}

/**
 * esbuild plugin that keeps dependencies out of the config bundle so they are
 * resolved and evaluated by Node's real module system instead:
 *
 * - Node builtins and ESM packages are left as native `import` statements.
 * - CJS packages are replaced with a shim that defers to the real `require`,
 *   sharing Node's module cache with the rest of the process.
 * - tsconfig "paths" aliases that resolve to project files (outside
 *   node_modules) are bundled like relative imports.
 */
const externalizeDependencies: esbuild.Plugin = {
  name: 'electron-forge-externalize-dependencies',
  setup(build) {
    build.onResolve({ filter: /^[^./]/ }, async (args) => {
      // Skip entry points, absolute paths, and the re-resolutions we trigger
      // via build.resolve() below.
      if (
        args.kind === 'entry-point' ||
        args.pluginData === RESOLVE_SKIP_MARKER ||
        path.isAbsolute(args.path)
      ) {
        return undefined;
      }
      if (isBuiltin(args.path)) {
        return { path: args.path, external: true };
      }
      // Let esbuild resolve the specifier first (this applies tsconfig
      // "paths"); aliases that land on project files are bundled as usual.
      const resolved = await build.resolve(args.path, {
        kind: args.kind,
        importer: args.importer,
        resolveDir: args.resolveDir,
        pluginData: RESOLVE_SKIP_MARKER,
      });
      if (
        resolved.errors.length === 0 &&
        resolved.path &&
        !resolved.path.split(path.sep).includes('node_modules')
      ) {
        return { path: resolved.path };
      }
      if (specifierIsESM(args.path, args.resolveDir)) {
        return { path: args.path, external: true };
      }
      return { path: args.path, namespace: REQUIRE_SHIM_NAMESPACE };
    });
    build.onLoad(
      { filter: /.*/, namespace: REQUIRE_SHIM_NAMESPACE },
      (args) => ({
        // `__forgeRequire` comes from the banner injected in
        // loadTypeScriptConfig(). A bare `require` would be resolved by esbuild
        // again and loop straight back into this shim.
        contents: `module.exports = __forgeRequire(${JSON.stringify(args.path)});`,
        loader: 'js',
      }),
    );
  },
};

/**
 * Loads a TypeScript (`.ts`/`.cts`/`.mts`) Forge config by bundling the
 * config's own module graph with esbuild and then natively `import()`ing the
 * bundled output from a temporary file next to the config (deleted once the
 * import settles, the same trade-off Vite makes for its config files).
 *
 * Dependencies are deliberately NOT bundled — see the plugin above. This
 * means every package the config (or hooks defined in it) loads is the exact
 * same instance the rest of the process sees. Loaders that evaluate
 * dependencies in a parallel module system (like jiti) hand out duplicate
 * copies of packages such as webpack, which silently breaks `instanceof` and
 * class-static checks across the boundary (#3949).
 */
export async function loadTypeScriptConfig<T>(configPath: string): Promise<T> {
  const outfile = path.join(
    path.dirname(configPath),
    `.forge.config.timestamp-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`,
  );
  await esbuild.build({
    entryPoints: [configPath],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile,
    // Inline sourcemap so stack traces from the config point at the
    // TypeScript source.
    sourcemap: 'inline',
    logLevel: 'silent',
    plugins: [externalizeDependencies],
    banner: {
      js: "import { createRequire as __forgeCreateRequire } from 'node:module'; const __forgeRequire = __forgeCreateRequire(import.meta.url);",
    },
  });
  try {
    return await import(pathToFileURL(outfile).toString());
  } finally {
    fs.rmSync(outfile, { force: true });
  }
}

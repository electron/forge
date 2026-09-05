import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as vite from 'vite';
import { build, createServer, resolveConfig } from 'vite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { pluginNodeIntegration } from '../../src/config/vite.node-integration.config';

describe('pluginNodeIntegration', () => {
  let root: string;

  beforeEach(async () => {
    const temporaryRoot = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'electron-forge-vite-node-integration-'),
    );
    root = await fs.promises.realpath(temporaryRoot);
    await fs.promises.writeFile(
      path.join(root, 'renderer.js'),
      `
import electron, { ipcRenderer } from 'electron';
import * as fs from 'node:fs';
import { join } from 'node:path';

window.audit = async () => ({
  electron: electron.ipcRenderer === ipcRenderer,
  exists: fs.existsSync(join(process.cwd(), 'package.json')),
  platform: (await import('node:os')).platform(),
});
`,
    );
  });

  afterEach(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  it('preserves Node and Electron imports in production builds', async () => {
    const result = await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [pluginNodeIntegration()],
      build: {
        minify: false,
        write: false,
        rollupOptions: { input: path.join(root, 'renderer.js') },
      },
    });
    const output = (Array.isArray(result) ? result : [result])
      .flatMap((buildResult) => buildResult.output)
      .filter((item) => item.type === 'chunk')
      .map((item) => item.code)
      .join('\n');

    // Assert the *behaviour* -- each module is required at runtime rather than
    // bundled -- not one bundler's spelling of it. Rollup emits the shim's
    // `require("electron")` verbatim; Rolldown (Vite 8+) rewrites it into an
    // interop wrapper that ends in `}))("electron")` and reaches `require`
    // through `require.apply(this, arguments)`. Matching a literal `require(`
    // passes on Rollup and silently fails on Rolldown even when the output is
    // correct, so match the requested specifier next to a `require` mention.
    for (const specifier of ['electron', 'node:fs', 'node:path', 'node:os']) {
      expect(output).toContain(JSON.stringify(specifier));
    }
    expect(output).toMatch(/require/);
    // The real regression this guards: if the shim's require gets resolved or
    // tree-shaken away, Vite substitutes its empty browser stub instead.
    expect(output).not.toContain('__vite-browser-external');
    // ...and it must not bundle the npm `electron` package, which outside
    // Electron is the installer stub, not the API.
    expect(output).not.toContain('Downloading Electron binary');
  });

  it('serves Node and Electron imports through runtime shims', async () => {
    const server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [pluginNodeIntegration()],
      server: { middlewareMode: true },
    });

    try {
      const result = await server.transformRequest('/renderer.js');
      expect(result?.code).toContain(
        '/@id/__x00__electron-forge-node-integration:electron',
      );
      expect(result?.code).toContain(
        '/@id/__x00__electron-forge-node-integration:node:fs',
      );
      expect(result?.code).not.toContain('__vite-browser-external');
    } finally {
      await server.close();
    }
  });

  it('re-exports every Electron API in the shipped export list', async () => {
    // `electronExportNames` in the plugin is written out by hand, and a name
    // missing from it is a hard build failure rather than a degraded import:
    // Rollup rejects `"X" is not exported by "<virtual>:electron"` for a
    // real-but-unlisted API exactly as it does for a name that never existed.
    // `ServiceWorkerMain` was missing and is the regression this pins.
    //
    // This asserts against the `.d.ts` Electron ships rather than
    // `Object.keys(require('electron'))`, even though the runtime is the better
    // source of truth, because these specs run under plain Node -- where
    // Electron's package resolves to its installer stub and `require('electron')`
    // is the *executable path string*. That is the same reason the plugin needs a
    // written-out list at all. `ServiceWorkerMain` is therefore added on top of
    // the parsed names: the typings declare it only as a `type`, while Electron
    // 39's main process exports it as a real constructor, so the typings alone
    // would silently drop it again.
    // These specs compile with `"module": "commonjs"` (tsconfig.test.json), so
    // `import.meta.url` is a TS1343 error here and `__dirname` is the portable
    // way to anchor a path.
    //
    // The typings are located by path rather than `require.resolve('electron')`
    // because `electron` is a devDependency of the workspace ROOT, not of this
    // package: resolving it as a bare specifier from here is a genuine
    // `n/no-extraneous-require` error, and the rule keys on the specifier, so
    // passing `paths` does not satisfy it. Adding the dependency to this package
    // just for one spec would be worse.
    const typingsPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      'node_modules',
      'electron',
      'electron.d.ts',
    );
    const typings = await fs.promises.readFile(typingsPath, 'utf8');
    const namespace = typings.slice(
      typings.indexOf('namespace CrossProcessExports'),
    );
    const documented = new Set([
      ...[...namespace.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*:/g)].map(
        (match) => match[1],
      ),
      ...[...namespace.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)\s/g)].map(
        (match) => match[1],
      ),
      'ServiceWorkerMain',
    ]);
    // Guards against a silently-empty set turning this into a test that cannot
    // fail: parsing nothing would make the generated module import nothing.
    expect(documented.size).toBeGreaterThan(20);

    await fs.promises.writeFile(
      path.join(root, 'every-api.js'),
      [...documented]
        .map(
          (name, index) => `import { ${name} as api${index} } from 'electron';`,
        )
        .join('\n') +
        `\nwindow.apis = [${[...documented].map((_name, index) => `api${index}`).join(', ')}];\n`,
    );

    await expect(
      build({
        root,
        configFile: false,
        logLevel: 'silent',
        plugins: [pluginNodeIntegration()],
        build: {
          minify: false,
          write: false,
          rollupOptions: { input: path.join(root, 'every-api.js') },
        },
      }),
    ).resolves.toBeDefined();
  });

  it('keeps user dependency and Rollup settings', async () => {
    const userIgnore = (id: string) => id === 'custom-module';
    const config = await resolveConfig(
      {
        configFile: false,
        plugins: [pluginNodeIntegration()],
        optimizeDeps: { exclude: ['custom-dependency'] },
        build: {
          commonjsOptions: { ignore: userIgnore },
          rollupOptions: { output: { entryFileNames: 'custom.js' } },
        },
      },
      'build',
    );
    const ignore = config.build.commonjsOptions.ignore;

    expect(config.optimizeDeps.exclude).toContain('custom-dependency');
    expect(config.optimizeDeps.exclude).toContain('node:fs');
    expect(ignore).toBeTypeOf('function');
    expect((ignore as (id: string) => boolean)('custom-module')).toBe(true);
    expect((ignore as (id: string) => boolean)('node:fs')).toBe(true);
    // The user's own output settings must survive untouched on every Vite.
    expect(config.build.rollupOptions.output).toMatchObject({
      entryFileNames: 'custom.js',
    });
    // `output.freeze` is Rollup-only. Vite 8 bundles Rolldown, which never emits
    // `Object.freeze`, so the plugin deliberately omits the key there -- setting
    // it would be a type error against Rolldown's `OutputOptions` and a no-op at
    // runtime. Assert whichever behaviour the installed Vite calls for, so this
    // spec keeps its teeth on Vite 6/7 instead of being loosened for both.
    const output = config.build.rollupOptions.output as { freeze?: boolean };
    if ((vite as { rolldownVersion?: string }).rolldownVersion === undefined) {
      expect(output.freeze).toBe(false);
    } else {
      expect(output).not.toHaveProperty('freeze');
    }
  });
});

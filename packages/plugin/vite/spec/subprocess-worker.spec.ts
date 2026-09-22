import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import type { VitePluginConfig } from '../src/Config';

const projectDir = path.join(
  import.meta.dirname,
  'fixtures',
  'subprocess-build',
);
const workerPath = path.resolve(
  import.meta.dirname,
  '..',
  'dist',
  'subprocess-worker.js',
);

function runWorker(
  kind: 'build' | 'renderer',
  index: number,
  config: Pick<VitePluginConfig, 'build' | 'renderer'>,
) {
  return new Promise<{ code: number | null; stderr: string }>(
    (resolve, reject) => {
      const child = spawn(process.execPath, [workerPath], {
        cwd: projectDir,
        env: {
          ...process.env,
          FORGE_VITE_PROJECT_DIR: projectDir,
          FORGE_VITE_KIND: kind,
          FORGE_VITE_INDEX: String(index),
          FORGE_VITE_CONFIG: JSON.stringify(config),
        },
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      let stderr = '';
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (c) => (stderr += c));
      child.on('error', reject);
      child.on('close', (code) => resolve({ code, stderr }));
    },
  );
}

describe('subprocess-worker', () => {
  const viteOutDir = path.join(projectDir, '.vite');

  afterEach(() => {
    fs.rmSync(viteOutDir, { recursive: true, force: true });
  });

  it('builds a main target and writes output', async () => {
    const config: Pick<VitePluginConfig, 'build' | 'renderer'> = {
      build: [
        {
          entry: 'src/main.js',
          config: path.join(projectDir, 'vite.main.config.mjs'),
          target: 'main',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: path.join(projectDir, 'vite.renderer.config.mjs'),
        },
      ],
    };

    const { code, stderr } = await runWorker('build', 0, config);
    expect(code, stderr).toBe(0);

    const outFile = path.join(viteOutDir, 'build', 'main.cjs');
    expect(fs.existsSync(outFile)).toBe(true);
    // getBuildDefine should have injected the renderer name define.
    const contents = fs.readFileSync(outFile, 'utf8');
    expect(contents).toContain('world');
  });

  it('builds a renderer target and writes output', async () => {
    const config: Pick<VitePluginConfig, 'build' | 'renderer'> = {
      build: [],
      renderer: [
        {
          name: 'main_window',
          config: path.join(projectDir, 'vite.renderer.config.mjs'),
        },
      ],
    };

    const { code, stderr } = await runWorker('renderer', 0, config);
    expect(code, stderr).toBe(0);

    const outHtml = path.join(
      viteOutDir,
      'renderer',
      'main_window',
      'index.html',
    );
    expect(fs.existsSync(outHtml)).toBe(true);
  });

  it('injects renderer name defines into main targets', async () => {
    // This validates that the worker receives the FULL renderer list, not just
    // the single build spec. getBuildDefine() reads forgeConfig.renderer to
    // generate ${NAME}_VITE_NAME defines — if the worker only got a
    // single-spec config, this define would be missing and the build would
    // fail (undefined reference) or produce wrong output.
    const config: Pick<VitePluginConfig, 'build' | 'renderer'> = {
      build: [
        {
          entry: 'src/main-with-define.js',
          config: path.join(projectDir, 'vite.main.config.mjs'),
          target: 'main',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: path.join(projectDir, 'vite.renderer.config.mjs'),
        },
      ],
    };

    const { code, stderr } = await runWorker('build', 0, config);
    expect(code, stderr).toBe(0);

    const outFile = path.join(viteOutDir, 'build', 'main-with-define.cjs');
    const contents = fs.readFileSync(outFile, 'utf8');
    // MAIN_WINDOW_VITE_NAME should be statically replaced with "main_window"
    expect(contents).toMatch(/["'`]main_window["'`]/);
    expect(contents).not.toContain('MAIN_WINDOW_VITE_NAME');
  });

  it('builds main targets as Node bundles', async () => {
    // The main process is built with `build.ssr`, so Vite must not treat the
    // bundle as browser code: `process.env` reads stay live, `import.meta.*`
    // lowers to real CommonJS instead of the browser shims that used to leave
    // `{}.url` (and `self`) behind, and no module-preload polyfill is emitted.
    const config: Pick<VitePluginConfig, 'build' | 'renderer'> = {
      build: [
        {
          entry: 'src/main-node-globals.js',
          config: path.join(projectDir, 'vite.main.config.mjs'),
          target: 'main',
        },
      ],
      renderer: [],
    };

    const { code, stderr } = await runWorker('build', 0, config);
    expect(code, stderr).toBe(0);

    const outFile = path.join(viteOutDir, 'build', 'main-node-globals.cjs');
    const contents = fs.readFileSync(outFile, 'utf8');

    // `process.env.FOO` must be read at runtime, not inlined to `undefined`.
    expect(contents).toContain('process.env.FOO');
    expect(contents).toContain('__dirname');
    // A `.cjs` file cannot contain `import.meta`, and the browser lowering of
    // it references `self`.
    expect(contents).not.toContain('import.meta');
    expect(contents).not.toMatch(/\bself\b/);
    // No module-preload polyfill helper, even though the entry code-splits.
    expect(contents).not.toContain('__vitePreload');
    expect(contents).not.toContain('modulepreload');

    // Actually run the bundle to prove the lowering works.
    const require = createRequire(import.meta.url);
    process.env.FOO = 'forge-test-env';
    try {
      const built = require(outFile);
      expect(built.fromEnv).toBe('forge-test-env');
      expect(built.dir).toBe(path.dirname(outFile));
      expect(built.metaUrl).toBe(pathToFileURL(outFile).href);
      expect(built.metaDirname).toBe(path.dirname(outFile));
      await expect(built.lazy()).resolves.toMatchObject({
        lazyMarker: 'from-lazy',
      });
    } finally {
      delete process.env.FOO;
    }
  });

  it('still substitutes the dev server URL define under the Node build', async () => {
    // The `process.env` self-defines must not shadow Forge's own defines. In a
    // production build the URL define resolves to `undefined`, which is what
    // main-process code checks for to decide between `loadURL` and `loadFile`.
    const config: Pick<VitePluginConfig, 'build' | 'renderer'> = {
      build: [
        {
          entry: 'src/main-dev-server-url.js',
          config: path.join(projectDir, 'vite.main.config.mjs'),
          target: 'main',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: path.join(projectDir, 'vite.renderer.config.mjs'),
        },
      ],
    };

    const { code, stderr } = await runWorker('build', 0, config);
    expect(code, stderr).toBe(0);

    const outFile = path.join(viteOutDir, 'build', 'main-dev-server-url.cjs');
    const contents = fs.readFileSync(outFile, 'utf8');
    expect(contents).not.toContain('MAIN_WINDOW_VITE_DEV_SERVER_URL');

    const require = createRequire(import.meta.url);
    expect(require(outFile).devServerUrl).toBeUndefined();
  });

  it('resolves browser entry points for preload targets', async () => {
    // Preload scripts are a hybrid environment, so `ssr.resolve` overrides the
    // Node-first defaults of Vite's `ssr` environment with browser-first ones.
    const config: Pick<VitePluginConfig, 'build' | 'renderer'> = {
      build: [
        {
          entry: 'src/preload-browser-field.js',
          config: path.join(projectDir, 'vite.preload.config.mjs'),
          target: 'preload',
        },
      ],
      renderer: [],
    };

    const { code, stderr } = await runWorker('build', 0, config);
    expect(code, stderr).toBe(0);

    const outFile = path.join(viteOutDir, 'build', 'preload-browser-field.cjs');
    const contents = fs.readFileSync(outFile, 'utf8');
    expect(contents).toContain('resolved-browser-entry');
    expect(contents).not.toContain('resolved-node-entry');
    expect(contents).not.toContain('__vitePreload');
    expect(contents).not.toContain('modulepreload');
  });

  it('builds a preload target', async () => {
    const config: Pick<VitePluginConfig, 'build' | 'renderer'> = {
      build: [
        {
          entry: 'src/preload.js',
          config: path.join(projectDir, 'vite.preload.config.mjs'),
          target: 'preload',
        },
      ],
      renderer: [],
    };

    const { code, stderr } = await runWorker('build', 0, config);
    expect(code, stderr).toBe(0);

    const outFile = path.join(viteOutDir, 'build', 'preload.cjs');
    expect(fs.existsSync(outFile)).toBe(true);
    const contents = fs.readFileSync(outFile, 'utf8');
    expect(contents).toContain('from-preload');
  });

  it('builds the correct target when given a non-zero index', async () => {
    const config: Pick<VitePluginConfig, 'build' | 'renderer'> = {
      build: [
        {
          entry: 'src/main.js',
          config: path.join(projectDir, 'vite.main.config.mjs'),
          target: 'main',
        },
        {
          entry: 'src/secondary.js',
          config: path.join(projectDir, 'vite.main.config.mjs'),
          target: 'main',
        },
      ],
      renderer: [],
    };

    const { code, stderr } = await runWorker('build', 1, config);
    expect(code, stderr).toBe(0);

    // Only secondary should be built, not main.
    const secondaryOut = path.join(viteOutDir, 'build', 'secondary.cjs');
    const mainOut = path.join(viteOutDir, 'build', 'main.cjs');
    expect(fs.existsSync(secondaryOut)).toBe(true);
    expect(fs.existsSync(mainOut)).toBe(false);
    const contents = fs.readFileSync(secondaryOut, 'utf8');
    expect(contents).toContain('from-secondary');
  });

  it('exits nonzero and surfaces error when build fails', async () => {
    const config: Pick<VitePluginConfig, 'build' | 'renderer'> = {
      build: [
        {
          entry: 'src/does-not-exist.js',
          config: path.join(projectDir, 'vite.main.config.mjs'),
          target: 'main',
        },
      ],
      renderer: [],
    };

    const { code, stderr } = await runWorker('build', 0, config);
    expect(code).not.toBe(0);
    expect(stderr).toMatch(/does-not-exist/);
  });

  it('exits nonzero when required env vars are missing', async () => {
    const { code, stderr } = await new Promise<{
      code: number | null;
      stderr: string;
    }>((resolve, reject) => {
      const child = spawn(process.execPath, [workerPath], {
        env: { ...process.env, FORGE_VITE_PROJECT_DIR: projectDir },
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      let stderr = '';
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (c) => (stderr += c));
      child.on('error', reject);
      child.on('close', (code) => resolve({ code, stderr }));
    });

    expect(code).toBe(1);
    expect(stderr).toContain('missing');
  });
});

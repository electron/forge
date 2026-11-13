import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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

  it('asks the parent to restart the app after a main rebuild with hotRestart', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-vite-watch-'));
    fs.cpSync(projectDir, tmpDir, { recursive: true });
    const config: Pick<VitePluginConfig, 'build' | 'renderer' | 'hotRestart'> =
      {
        build: [
          {
            entry: 'src/main.js',
            config: path.join(tmpDir, 'vite.main.config.mjs'),
            target: 'main',
          },
        ],
        renderer: [],
        hotRestart: true,
      };

    const child = spawn(process.execPath, [workerPath], {
      cwd: tmpDir,
      env: {
        ...process.env,
        FORGE_VITE_PROJECT_DIR: tmpDir,
        FORGE_VITE_KIND: 'build',
        FORGE_VITE_INDEX: '0',
        FORGE_VITE_CONFIG: JSON.stringify(config),
        FORGE_VITE_WATCH: '1',
      },
      stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    });
    const messages: string[] = [];
    const waitFor = (type: string) =>
      new Promise<void>((resolve) => {
        child.on('message', (msg: { type: string }) => {
          if (msg.type === type) resolve();
        });
      });
    child.on('message', (msg: { type: string }) => messages.push(msg.type));

    try {
      await waitFor('first-build-done');
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(messages).toEqual(['first-build-done']);

      const restarted = waitFor('restart');
      fs.appendFileSync(path.join(tmpDir, 'src', 'main.js'), '\n// rebuild\n');
      await restarted;
      expect(messages).toEqual(['first-build-done', 'restart']);
    } finally {
      const closed = new Promise((resolve) => child.once('close', resolve));
      child.kill();
      await closed;
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
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

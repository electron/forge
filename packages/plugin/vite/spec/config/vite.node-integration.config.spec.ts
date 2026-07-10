import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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

    expect(output).toMatch(/runtimeRequire(?:\$\d+)?\("electron"\)/);
    expect(output).toMatch(/runtimeRequire(?:\$\d+)?\("node:fs"\)/);
    expect(output).toMatch(/runtimeRequire(?:\$\d+)?\("node:path"\)/);
    expect(output).toMatch(/runtimeRequire(?:\$\d+)?\("node:os"\)/);
    expect(output).not.toContain('__vite-browser-external');
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
    expect(config.build.rollupOptions.output).toMatchObject({
      entryFileNames: 'custom.js',
      freeze: false,
    });
  });
});

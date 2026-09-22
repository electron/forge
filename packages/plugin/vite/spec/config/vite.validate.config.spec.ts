import path from 'node:path';

import { build, createLogger } from 'vite';
import { describe, expect, it, vi } from 'vitest';

import { pluginValidateConfig } from '../../src/config/vite.validate.config';

import type { VitePluginConfig } from '../../src/Config';
import type { ConfigEnv, InlineConfig } from 'vite';

const root = path.join(import.meta.dirname, '..', 'fixtures', 'validate');
const mainConfigFile = path.join(root, 'vite.main.config.mjs');
const rendererConfigFile = path.join(root, 'vite.renderer.config.mjs');

const forgeConfig: VitePluginConfig = { build: [], renderer: [] };

function buildEnv(
  entry: string,
  target: 'main' | 'preload' = 'main',
): ConfigEnv<'build'> {
  return {
    command: 'build',
    mode: 'production',
    root,
    forgeConfig,
    forgeConfigSelf: { entry, config: mainConfigFile, target },
  };
}

function rendererEnv(name = 'main_window'): ConfigEnv<'renderer'> {
  return {
    command: 'build',
    mode: 'production',
    root,
    forgeConfig,
    forgeConfigSelf: { name, config: rendererConfigFile },
  };
}

/**
 * Warnings go through `config.logger`, so the build gets one we can spy on.
 * Only the validator's own warnings are of interest here; Vite emits its own.
 */
function spyLogger() {
  const customLogger = createLogger('silent');
  const warn = vi.spyOn(customLogger, 'warn');
  const forgeWarnings = () =>
    warn.mock.calls
      .map(([message]) => message)
      .filter((message) => message.includes('@electron-forge/plugin-vite'));

  return { customLogger, forgeWarnings };
}

// Builds are kept in memory: the validator runs in `configResolved`, long
// before anything would be written.
function buildWith(config: InlineConfig) {
  return build({
    configFile: false,
    logLevel: 'silent',
    root,
    ...config,
    build: { write: false, ...config.build },
  });
}

describe('pluginValidateConfig', () => {
  it('names the plugin after its target', () => {
    expect(pluginValidateConfig('main', buildEnv('src/main.js')).name).toEqual(
      '@electron-forge/plugin-vite:validate-main',
    );
    expect(
      pluginValidateConfig('preload', buildEnv('src/preload.js', 'preload'))
        .name,
    ).toEqual('@electron-forge/plugin-vite:validate-preload');
    expect(pluginValidateConfig('renderer', rendererEnv()).name).toEqual(
      '@electron-forge/plugin-vite:validate-renderer',
    );
  });

  it('throws when a main target has no entry', async () => {
    await expect(
      buildWith({
        plugins: [pluginValidateConfig('main', buildEnv('src/main.js'))],
      }),
    ).rejects.toThrow(
      /The main target "src\/main\.js" \(.*vite\.main\.config\.mjs\) has nothing to build/,
    );
  });

  it('throws when the main entry does not exist on disk', async () => {
    await expect(
      buildWith({
        build: {
          lib: { entry: 'src/nope.js', formats: ['cjs'] },
        },
        plugins: [pluginValidateConfig('main', buildEnv('src/nope.js'))],
      }),
    ).rejects.toThrow(/has an entry that does not exist: "src\/nope\.js"/);
  });

  it('throws when a main target emits ESM', async () => {
    await expect(
      buildWith({
        build: {
          lib: { entry: 'src/main.js', formats: ['es'] },
        },
        plugins: [pluginValidateConfig('main', buildEnv('src/main.js'))],
      }),
    ).rejects.toThrow(
      /emits the "es" output format\. ESM main bundles are not supported yet/,
    );
  });

  it('throws when a preload target emits more than one output', async () => {
    await expect(
      buildWith({
        build: {
          rollupOptions: {
            input: 'src/preload.js',
            output: [{ format: 'cjs' }, { format: 'es' }],
          },
        },
        plugins: [
          pluginValidateConfig(
            'preload',
            buildEnv('src/preload.js', 'preload'),
          ),
        ],
      }),
    ).rejects.toThrow(
      /The preload target "src\/preload\.js" .* is configured to emit 2 outputs \("cjs", "es"\), but Electron loads a single preload bundle/,
    );
  });

  it('accepts an output that only customizes file names', async () => {
    const { customLogger, forgeWarnings } = spyLogger();

    // The format comes from `build.lib.formats`, not from the output.
    await buildWith({
      customLogger,
      build: {
        lib: { entry: 'src/main.js', formats: ['cjs'] },
        rollupOptions: { output: { entryFileNames: '[name].cjs' } },
      },
      plugins: [pluginValidateConfig('main', buildEnv('src/main.js'))],
    });

    expect(forgeWarnings()).toEqual([]);
  });

  it('throws when a main target is built for a browser', async () => {
    await expect(
      buildWith({
        build: {
          target: 'chrome120',
          lib: { entry: 'src/main.js', formats: ['cjs'] },
        },
        plugins: [pluginValidateConfig('main', buildEnv('src/main.js'))],
      }),
    ).rejects.toThrow(
      /sets "build\.target" to "chrome120", but main code runs in Electron's Node\.js runtime/,
    );
  });

  it('accepts a node build target for main', async () => {
    const { customLogger, forgeWarnings } = spyLogger();

    await buildWith({
      customLogger,
      build: {
        target: 'node22',
        lib: { entry: 'src/main.js', formats: ['cjs'] },
      },
      plugins: [pluginValidateConfig('main', buildEnv('src/main.js'))],
    });

    expect(forgeWarnings()).toEqual([]);
  });

  it('throws when a renderer target has no index.html and no input', async () => {
    const noHtmlRoot = path.join(root, 'no-html');

    await expect(
      buildWith({
        root: noHtmlRoot,
        plugins: [pluginValidateConfig('renderer', rendererEnv())],
      }),
    ).rejects.toThrow(
      /The renderer target "main_window" .* has nothing to build: there is no "index\.html"/,
    );
  });

  it('warns but still builds when a renderer sets an unusual base', async () => {
    const { customLogger, forgeWarnings } = spyLogger();

    await buildWith({
      customLogger,
      base: '/foo/',
      plugins: [pluginValidateConfig('renderer', rendererEnv())],
    });

    expect(forgeWarnings()).toEqual([
      expect.stringMatching(
        /The renderer target "main_window" .* sets "base" to "\/foo\/"/,
      ),
    ]);
  });

  it('warns when a renderer is built for Node', async () => {
    const { customLogger, forgeWarnings } = spyLogger();

    await buildWith({
      customLogger,
      base: './',
      build: { target: 'node22' },
      plugins: [pluginValidateConfig('renderer', rendererEnv())],
    });

    expect(forgeWarnings()).toEqual([
      expect.stringMatching(
        /sets "build\.target" to "node22"\. Renderer code runs in Electron's Chromium/,
      ),
    ]);
  });

  it('passes valid main, preload and renderer configs without warnings', async () => {
    const main = spyLogger();
    await buildWith({
      customLogger: main.customLogger,
      build: {
        lib: {
          entry: 'src/main.js',
          fileName: () => '[name].cjs',
          formats: ['cjs'],
        },
      },
      plugins: [pluginValidateConfig('main', buildEnv('src/main.js'))],
    });
    expect(main.forgeWarnings()).toEqual([]);

    const preload = spyLogger();
    await buildWith({
      customLogger: preload.customLogger,
      build: {
        rollupOptions: {
          input: 'src/preload.js',
          output: { format: 'cjs', entryFileNames: '[name].cjs' },
        },
      },
      plugins: [
        pluginValidateConfig('preload', buildEnv('src/preload.js', 'preload')),
      ],
    });
    expect(preload.forgeWarnings()).toEqual([]);

    const renderer = spyLogger();
    await buildWith({
      customLogger: renderer.customLogger,
      base: './',
      plugins: [pluginValidateConfig('renderer', rendererEnv())],
    });
    expect(renderer.forgeWarnings()).toEqual([]);
  });
});

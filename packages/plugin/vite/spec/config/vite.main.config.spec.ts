import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { getConfig } from '../../src/config/vite.main.config';

import type { VitePluginConfig } from '../../src/Config';
import type { ConfigEnv, Rollup } from 'vite';

const configRoot = path.join(import.meta.dirname, 'fixtures/vite-configs');
const forgeConfig: VitePluginConfig = {
  build: [
    {
      entry: 'src/main.js',
      config: path.join(configRoot, 'vite.main.config.mjs'),
      target: 'main',
    },
  ],
  renderer: [
    {
      name: 'main_window',
      config: path.join(configRoot, 'vite.renderer.config.mjs'),
    },
  ],
};

function buildEnv(
  overrides: Partial<ConfigEnv<'build'>> = {},
): ConfigEnv<'build'> {
  return {
    command: 'build',
    mode: 'production',
    root: configRoot,
    forgeConfig,
    forgeConfigSelf: forgeConfig.build[0],
    ...overrides,
  };
}

/**
 * The runtime is injected by a Forge-owned plugin's `outputOptions` hook (so
 * a user's own `output.banner` composes with it instead of replacing it);
 * resolve the banner the way Rollup would.
 */
function getBanner(
  config: ReturnType<typeof getConfig>,
  existingOutput: Rollup.OutputOptions = {},
): string | Rollup.OutputOptions['banner'] | undefined {
  const plugins = (config.plugins ?? []).flat() as Rollup.Plugin[];
  const runtimePlugin = plugins.find(
    (plugin) =>
      plugin?.name === '@electron-forge/plugin-vite:app-protocol-runtime',
  );
  if (!runtimePlugin) return undefined;
  const outputOptions = runtimePlugin.outputOptions as (
    output: Rollup.OutputOptions,
  ) => Rollup.OutputOptions;
  return outputOptions.call(undefined as never, existingOutput).banner;
}

describe('vite.main.config', () => {
  it('does not inject the app protocol runtime by default', () => {
    const config = getConfig(buildEnv());
    expect(getBanner(config)).toBeUndefined();
  });

  it('injects the app protocol runtime when appProtocol is enabled', () => {
    const config = getConfig(
      buildEnv({ forgeConfig: { ...forgeConfig, appProtocol: true } }),
    );
    const banner = getBanner(config);
    expect(banner).toContain('registerSchemesAsPrivileged');
    expect(banner).toContain('protocol.handle');
    expect(banner).toContain('"main_window"');
  });

  it('composes with a user-configured output banner instead of replacing it', () => {
    const config = getConfig(
      buildEnv({ forgeConfig: { ...forgeConfig, appProtocol: true } }),
    );
    const banner = getBanner(config, { banner: '/* user banner */' });
    expect(banner).toMatch(/^'use strict';/);
    expect(banner).toContain('registerSchemesAsPrivileged');
    expect(banner).toMatch(/\/\* user banner \*\/$/);
  });

  it('accepts the object form and includes additional privileged schemes', () => {
    const config = getConfig(
      buildEnv({
        forgeConfig: {
          ...forgeConfig,
          appProtocol: {
            additionalPrivilegedSchemes: [
              { scheme: 'media', privileges: { stream: true } },
            ],
          },
        },
      }),
    );
    const banner = getBanner(config);
    expect(banner).toContain('registerSchemesAsPrivileged');
    expect(banner).toContain('"media"');
    expect(banner).toContain('"stream":true');
  });

  it('serves over a custom scheme when configured', () => {
    const config = getConfig(
      buildEnv({
        forgeConfig: { ...forgeConfig, appProtocol: { scheme: 'myapp' } },
      }),
    );
    const banner = getBanner(config);
    expect(banner).toContain('"scheme":"myapp"');
    expect(banner).not.toContain('"scheme":"app"');
  });

  it('rejects an invalid scheme at config time', () => {
    expect(() =>
      getConfig(
        buildEnv({
          forgeConfig: { ...forgeConfig, appProtocol: { scheme: 'My App' } },
        }),
      ),
    ).toThrow(/valid lowercase URI scheme/);
  });

  it('rejects an additional privileged scheme named app', () => {
    expect(() =>
      getConfig(
        buildEnv({
          forgeConfig: {
            ...forgeConfig,
            appProtocol: {
              additionalPrivilegedSchemes: [{ scheme: 'app' }],
            },
          },
        }),
      ),
    ).toThrow(/reserved/);
  });

  it('injects only the serving handler with registerSchemes: false', () => {
    const config = getConfig(
      buildEnv({
        forgeConfig: {
          ...forgeConfig,
          appProtocol: { registerSchemes: false },
        },
      }),
    );
    const banner = getBanner(config);
    expect(banner).toContain('protocol.handle');
    expect(banner).not.toContain('registerSchemesAsPrivileged');
  });

  it('injects nothing for dev server builds with registerSchemes: false', () => {
    const config = getConfig(
      buildEnv({
        command: 'serve',
        mode: 'development',
        forgeConfig: {
          ...forgeConfig,
          appProtocol: { registerSchemes: false },
        },
      }),
    );
    expect(getBanner(config)).toBeUndefined();
  });

  it('injects the entry fallback plugin only for builds without appProtocol', () => {
    const hasFallback = (config: ReturnType<typeof getConfig>) =>
      ((config.plugins ?? []).flat() as Rollup.Plugin[]).some(
        (plugin) =>
          plugin?.name === '@electron-forge/plugin-vite:vite-entry-fallback',
      );

    // Without appProtocol the *_VITE_ENTRY defines point at globals that the
    // fallback plugin's banner assigns packaged file:// URLs.
    expect(hasFallback(getConfig(buildEnv()))).toEqual(true);
    expect(
      hasFallback(
        getConfig(
          buildEnv({ forgeConfig: { ...forgeConfig, appProtocol: true } }),
        ),
      ),
    ).toEqual(false);
    // In dev the defines are dev-server URL strings.
    expect(
      hasFallback(
        getConfig(buildEnv({ command: 'serve', mode: 'development' })),
      ),
    ).toEqual(false);
  });

  it('only registers privileged schemes for dev server builds', () => {
    // Schemes must carry the same privileges under `electron-forge start` as
    // in the packaged app, but the dev server serves the renderers, so the
    // protocol handler itself is production-only.
    const config = getConfig(
      buildEnv({
        command: 'serve',
        mode: 'development',
        forgeConfig: { ...forgeConfig, appProtocol: true },
      }),
    );
    const banner = getBanner(config);
    expect(banner).toContain('registerSchemesAsPrivileged');
    expect(banner).not.toContain('protocol.handle');
  });
});

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

function getBanner(config: ReturnType<typeof getConfig>): string | undefined {
  const output = config.build?.rollupOptions?.output as
    | Rollup.OutputOptions
    | undefined;
  return output?.banner as string | undefined;
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

  it('does not inject the app protocol runtime for dev server builds', () => {
    const config = getConfig(
      buildEnv({
        command: 'serve',
        mode: 'development',
        forgeConfig: { ...forgeConfig, appProtocol: true },
      }),
    );
    expect(getBanner(config)).toBeUndefined();
  });
});

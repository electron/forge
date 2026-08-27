import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  getAppProtocolBanner,
  getAppProtocolEntryUrl,
} from '../../src/config/app-protocol';
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

describe('app-protocol', () => {
  it('builds entry URLs on the app scheme', () => {
    expect(getAppProtocolEntryUrl('main_window')).toEqual(
      'app://main_window/index.html',
    );
  });

  it('emits syntactically valid runtime code', () => {
    const banner = getAppProtocolBanner(['main_window', 'second_window']);
    // Throws on a syntax error without executing the code.
    expect(() => new Function(banner)).not.toThrow();
    expect(banner).toContain('["main_window","second_window"]');
  });

  it('registers additional privileged schemes alongside app', () => {
    const banner = getAppProtocolBanner(
      ['main_window'],
      [{ scheme: 'media', privileges: { stream: true, bypassCSP: true } }],
    );
    expect(() => new Function(banner)).not.toThrow();
    // A single registerSchemesAsPrivileged call containing both schemes, with
    // the app scheme first.
    const registrations = banner.match(/registerSchemesAsPrivileged/g);
    expect(registrations).toHaveLength(1);
    expect(banner).toMatch(/"scheme":"app".*"scheme":"media"/s);
    expect(banner).toContain('"bypassCSP":true');
  });

  it('throws when an additional scheme conflicts with the app scheme', () => {
    expect(() =>
      getAppProtocolBanner(['main_window'], [{ scheme: 'APP' }]),
    ).toThrow(/reserved/);
  });
});

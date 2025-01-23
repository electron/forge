import path from 'node:path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { describe, expect, it, vi } from 'vitest';

import findConfig, {
  forgeConfigIsValidFilePath,
  registerForgeConfigForDirectory,
  renderConfigTemplate,
  unregisterForgeConfigForDirectory,
} from '../../../src/util/forge-config';

const DEFAULTS = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [],
  publishers: [],
  plugins: [],
};

describe('findConfig', () => {
  it('falls back to default if no config exists', async () => {
    const fixturePath = path.resolve(__dirname, '../../fixture/no_forge_config');
    const config = await findConfig(fixturePath);
    expect(config).toEqual({ ...DEFAULTS, pluginInterface: expect.objectContaining({}) });
  });

  it('sets a pluginInterface property', async () => {
    const fixturePath = path.resolve(__dirname, '../../fixture/dummy_app');
    const config = await findConfig(fixturePath);
    expect(config).toEqual(expect.objectContaining({ pluginInterface: expect.objectContaining({}) }));
  });

  it('should resolve undefined from fromBuildIdentifier if no value is provided', async () => {
    type ResolveUndefConfig = ResolvedForgeConfig & { topLevelUndef?: string };
    const conf = (await findConfig(path.resolve(__dirname, '../../fixture/dummy_js_conf'))) as ResolveUndefConfig;
    expect(conf.topLevelUndef).toEqual(undefined);
  });

  it('should leave arrays intact', async () => {
    type NestedConfig = ResolvedForgeConfig & {
      sub: {
        prop: {
          inArray: string[];
        };
      };
    };
    const conf = (await findConfig(path.resolve(__dirname, '../../fixture/dummy_js_conf'))) as NestedConfig;
    expect(Array.isArray(conf.sub.prop.inArray)).toEqual(true);
  });

  it('should leave regexps intact', async () => {
    type RegExpConfig = ResolvedForgeConfig & { regexp: RegExp };
    const conf = (await findConfig(path.resolve(__dirname, '../../fixture/dummy_js_conf'))) as RegExpConfig;
    expect(conf.regexp).toBeInstanceOf(RegExp);
    expect(conf.regexp.test('foo')).toEqual(true);
    expect(conf.regexp.test('bar')).toEqual(false);
  });

  describe('from package.json', () => {
    it('throws if the "config.forge" property is not an object or requirable path', async () => {
      const fixturePath = path.resolve(__dirname, '../../fixture/bad_forge_config');
      const err = 'Expected packageJSON.config.forge to be an object or point to a requirable JS file';
      await expect(findConfig(fixturePath)).rejects.toThrow(err);
    });

    it('throws if the "config.forge" property is not parseable', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const fixturePath = path.resolve(__dirname, '../../fixture/bad_external_forge_config');
      const err = /Unexpected token/;
      await expect(findConfig(fixturePath)).rejects.toThrow(err);
      spy.mockRestore();
    });

    it('should resolve the "config.forge" object', async () => {
      const fixturePath = path.resolve(__dirname, '../../fixture/dummy_app');
      const config = await findConfig(fixturePath);
      expect(config).toEqual({
        ...DEFAULTS,
        packagerConfig: {
          baz: {},
        },
        s3: {},
        pluginInterface: expect.objectContaining({}),
      });
    });
  });

  describe('from forge.config.js', () => {
    it('resolves when "config.forge" points to a JS file', async () => {
      const fixturePath = path.resolve(__dirname, '../../fixture/dummy_js_conf');
      const config = await findConfig(fixturePath);
      expect(config).toEqual(
        expect.objectContaining({
          ...DEFAULTS,
          buildIdentifier: 'beta',
          packagerConfig: { foo: 'bar', baz: {} },
          s3: {},
          electronReleaseServer: {},
        })
      );
    });

    it('falls back to forge.config.js if "config.forge" does not exist', async () => {
      const fixturePath = path.resolve(__dirname, '../../fixture/dummy_default_js_conf');
      const conf = await findConfig(fixturePath);
      expect(conf.buildIdentifier).toEqual('default');
    });

    it('maintains functions from the JS export', async () => {
      const fixturePath = path.resolve(__dirname, '../../fixture/dummy_js_conf');
      const conf = await findConfig(fixturePath);
      const preStart = conf.hooks?.preStart;
      expect(preStart).not.toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- not undefined above
      expect(preStart!(conf)).toEqual('running preStart hook');
    });

    it('should support async configs', async () => {
      const fixturePath = path.resolve(__dirname, '../../fixture/async_forge_config');
      const config = await findConfig(fixturePath);
      expect(config).toEqual({
        ...DEFAULTS,
        makers: [
          {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
          },
        ],
        packagerConfig: { foo: {} },
        pluginInterface: expect.objectContaining({}),
      });
    });

    it('should support ESM configs', async () => {
      type DefaultResolvedConfig = ResolvedForgeConfig & { defaultResolved: boolean };
      const conf = (await findConfig(path.resolve(__dirname, '../../fixture/dummy_default_esm_conf'))) as DefaultResolvedConfig;
      expect(conf.buildIdentifier).toEqual('esm');
      expect(conf.defaultResolved).toEqual(true);
    });
  });

  describe('proxied objects', () => {
    it('allows access to built-ins', async () => {
      // Why: This needs to get refactored anyway.
      const fixture = path.resolve(__dirname, '../../fixture/dummy_js_conf');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conf: any = await findConfig(fixture);
      expect(conf.packagerConfig.baz.hasOwnProperty).toBeTypeOf('function');
      process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';
      // eslint-disable-next-line no-prototype-builtins
      expect(conf.s3.hasOwnProperty('secretAccessKey')).toBe(true);
      delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
    });

    it('allows overwrite of properties', async () => {
      // Why: This needs to get refactored anyway.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conf: any = await findConfig(path.resolve(__dirname, '../../fixture/dummy_js_conf'));
      expect(conf.packagerConfig.baz.hasOwnProperty).toBeTypeOf('function');
      expect(() => {
        conf.packagerConfig.baz = 'bar';
      }).not.toThrow();
      process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';

      const descriptor = {
        writable: true,
        enumerable: true,
        configurable: true,
        value: 'SecretyThing',
      };
      expect(Object.getOwnPropertyDescriptor(conf.s3, 'secretAccessKey')).toEqual(descriptor);
      expect(() => {
        conf.s3.secretAccessKey = 'bar';
      }).not.toThrow();
      expect(conf.s3.secretAccessKey).toEqual('bar');
      delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
    });

    it('magically maps properties to environment variables', async () => {
      type MappedConfig = ResolvedForgeConfig & {
        s3: {
          secretAccessKey?: string;
        };
        electronReleaseServer: {
          baseUrl: string;
        };
      };
      const conf = (await findConfig(path.resolve(__dirname, '../../fixture/dummy_js_conf'))) as MappedConfig;
      expect(conf.s3.secretAccessKey).toBe(undefined);

      process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';
      process.env.ELECTRON_FORGE_ELECTRON_RELEASE_SERVER_BASE_URL = 'http://example.com';
      expect(conf.s3.secretAccessKey).toEqual('SecretyThing');
      expect(conf.electronReleaseServer.baseUrl).toEqual('http://example.com');
      delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
      delete process.env.ELECTRON_FORGE_ELECTRON_RELEASE_SERVER_BASE_URL;
    });
  });

  describe('virtual config', () => {
    it('should resolve to the virtual config if present', async () => {
      const fixture = path.resolve(__dirname, '../../fixture/no_forge_config');
      try {
        registerForgeConfigForDirectory(fixture, { outDir: 'magic' });
        const config = await findConfig(fixture);
        expect(config).toEqual({
          ...DEFAULTS,
          outDir: 'magic',
          pluginInterface: expect.objectContaining({}),
        });
      } finally {
        unregisterForgeConfigForDirectory(fixture);
      }
    });

    it('should prioritize virtual config over package.json', async () => {
      const fixturePath = path.resolve(__dirname, '../../fixture/dummy_app');
      try {
        registerForgeConfigForDirectory(fixturePath, { outDir: 'magic' });
        const config = await findConfig(fixturePath);
        expect(config).toEqual({
          ...DEFAULTS,
          outDir: 'magic',
          pluginInterface: expect.objectContaining({}),
        });
      } finally {
        unregisterForgeConfigForDirectory(fixturePath);
      }
    });

    it('should prioritize virtual config over forge.config.js', async () => {
      const fixturePath = path.resolve(__dirname, '../../fixture/async_forge_config');
      try {
        registerForgeConfigForDirectory(fixturePath, { outDir: 'magic' });
        const config = await findConfig(fixturePath);
        expect(config).toEqual({
          ...DEFAULTS,
          outDir: 'magic',
          pluginInterface: expect.objectContaining({}),
        });
      } finally {
        unregisterForgeConfigForDirectory(fixturePath);
      }
    });
  });

  describe('alternate config formats', () => {
    it('should resolve the yml config from forge.config.yml specified in config.forge', async () => {
      const fixturePath = path.resolve(__dirname, '../../fixture/dummy_ts_conf');
      const conf = await findConfig(fixturePath);
      expect(conf.buildIdentifier).toEqual('yml');
    });

    it('should resolve the TS file exports of forge.config.ts if config.forge does not exist and the TS config exists', async () => {
      const fixturePath = path.resolve(__dirname, '../../fixture/dummy_default_ts_conf');
      const conf = await findConfig(fixturePath);
      expect(conf.buildIdentifier).toEqual('typescript');
    });
  });
});

it('should resolve values fromBuildIdentifier', async () => {
  type ResolveBIConfig = ResolvedForgeConfig & {
    topLevelProp: string;
    sub: {
      prop: {
        deep: {
          prop: string;
        };
        inArray: string[];
      };
    };
  };
  const conf = (await findConfig(path.resolve(__dirname, '../../fixture/dummy_js_conf'))) as ResolveBIConfig;
  expect(conf.topLevelProp).toEqual('foo');
  expect(conf.sub).toEqual({
    prop: {
      deep: {
        prop: 'bar',
      },
      inArray: ['arr', 'natural', 'array'],
    },
  });
});

describe('forgeConfigIsValidFilePath', () => {
  it('succeeds for a file extension-less path', async () => {
    const fixturePath = path.resolve(__dirname, '../../fixture/dummy_js_conf/');
    await expect(forgeConfigIsValidFilePath(fixturePath, 'forge.different.config')).resolves.toEqual(true);
  });

  it('fails when a file is nonexistent', async () => {
    const fixturePath = path.resolve(__dirname, '../../fixture/dummy_js_conf/');
    await expect(forgeConfigIsValidFilePath(fixturePath, 'forge.nonexistent.config')).resolves.toEqual(false);
  });
});

describe('renderConfigTemplate', () => {
  it('should import a JS file when a string starts with "require:"', () => {
    const dir = path.resolve(__dirname, '../../fixture/dummy_js_conf');
    const config = {
      foo: 'require:foo',
    };
    renderConfigTemplate(dir, {}, config);
    expect(config.foo).toEqual({
      bar: {
        baz: 'quux',
      },
    });
  });
});

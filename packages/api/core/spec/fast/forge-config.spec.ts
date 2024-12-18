import path from 'node:path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { describe, expect, it } from 'vitest';

import findConfig, {
  forgeConfigIsValidFilePath,
  registerForgeConfigForDirectory,
  renderConfigTemplate,
  unregisterForgeConfigForDirectory,
} from '../../src/util/forge-config';

const DEFAULTS = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [],
  publishers: [],
  plugins: [],
};

describe('forge-config', () => {
  describe('findConfig', () => {
    it('falls back to default if no config exists', async () => {
      const fixture = path.resolve(__dirname, '../../test/fixture/no_forge_config');
      const config = await findConfig(fixture);
      expect(config).toEqual({ ...DEFAULTS, pluginInterface: expect.objectContaining({}) });
    });

    it('sets a pluginInterface property when resolving', async () => {
      const fixture = path.resolve(__dirname, '../../test/fixture/dummy_app');
      const config = await findConfig(fixture);
      expect(config).toEqual(expect.objectContaining({ pluginInterface: expect.objectContaining({}) }));
    });

    describe('from package.json', () => {
      it('throws if the "config.forge" property is not an object or requirable path', async () => {
        const fixture = path.resolve(__dirname, '../../test/fixture/bad_forge_config');
        const err = 'Expected packageJSON.config.forge to be an object or point to a requirable JS file';
        await expect(findConfig(fixture)).rejects.toThrow(err);
      });

      it('throws if the "config.forge" property is not parseable', async () => {
        const fixture = findConfig(path.resolve(__dirname, '../../test/fixture/bad_external_forge_config'));
        const err = /Unexpected token/;
        await expect(fixture).rejects.toThrow(err);
      });
    });

    describe('from forge.config.js', () => {
      it('should support async configs exported in forge.config.js', async () => {
        const fixture = path.resolve(__dirname, '../../test/fixture/async_forge_config');
        const config = await findConfig(fixture);
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
    });
  });

  it('should resolve to the virtual config if present', async () => {
    const fixture = path.resolve(__dirname, '../../test/fixture/no_forge_config');
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

  it('should resolve virtual config instead of package.json', async () => {
    const fixturePath = path.resolve(__dirname, '../../test/fixture/dummy_app');
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

  it('should resolve virtual config instead of forge.config.js', async () => {
    const fixturePath = path.resolve(__dirname, '../../test/fixture/async_forge_config');
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

  it('should resolve the object in package.json with defaults if one exists', async () => {
    const config = await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_app'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (config as any).pluginInterface;
    expect(config).toEqual({
      ...DEFAULTS,
      packagerConfig: {
        baz: {},
      },
      s3: {},
    });
  });

  it('should allow access to built-ins of proxied objects', async () => {
    // Why: This needs to get refactored anyway.
    const fixture = path.resolve(__dirname, '../../test/fixture/dummy_js_conf');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conf: any = await findConfig(fixture);
    expect(conf.packagerConfig.baz.hasOwnProperty).toBeTypeOf('function');
    process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';
    // eslint-disable-next-line no-prototype-builtins
    expect(conf.s3.hasOwnProperty('secretAccessKey')).toBe(true);
    delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
  });

  it('should allow overwrite of properties in proxied objects', async () => {
    // Why: This needs to get refactored anyway.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conf: any = await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_js_conf'));
    expect(conf.packagerConfig.baz.hasOwnProperty).to.be.a('function');
    expect(() => {
      conf.packagerConfig.baz = 'bar';
    }).to.not.throw();
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
    }).to.not.throw();
    expect(conf.s3.secretAccessKey).to.equal('bar');
    delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
  });

  it('should resolve the JS file exports in config.forge points to a JS file', async () => {
    const config = JSON.parse(JSON.stringify(await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_js_conf'))));
    delete config.pluginInterface;
    delete config.sub;
    delete config.topLevelProp;
    delete config.topLevelUndef;
    delete config.regexp;
    expect(config).toEqual({
      ...DEFAULTS,
      buildIdentifier: 'beta',
      packagerConfig: { foo: 'bar', baz: {} },
      s3: {},
      electronReleaseServer: {},
    });
  });

  it('should resolve the JS file exports in config.forge points to a JS file and maintain functions', async () => {
    type MagicFunctionConfig = ResolvedForgeConfig & { magicFn: () => string };
    const conf = (await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_js_conf'))) as MagicFunctionConfig;
    expect(conf.magicFn).toBeTypeOf('function');
    expect(conf.magicFn()).toEqual('magic result');
  });

  it('should resolve the JS file exports of forge.config.js if config.forge does not exist ', async () => {
    type DefaultResolvedConfig = ResolvedForgeConfig & { defaultResolved: boolean };
    const conf = (await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_default_js_conf'))) as DefaultResolvedConfig;
    expect(conf.buildIdentifier).to.equal('default');
    expect(conf.defaultResolved).to.equal(true);
  });

  it('should resolve the ESM JS file exports of forge.config.js if config.forge does not exist ', async () => {
    type DefaultResolvedConfig = ResolvedForgeConfig & { defaultResolved: boolean };
    const conf = (await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_default_esm_conf'))) as DefaultResolvedConfig;
    expect(conf.buildIdentifier).to.equal('esm');
    expect(conf.defaultResolved).to.equal(true);
  });

  it(`should resolve the yml config from forge.config.yml if it's specified in config.forge`, async () => {
    type DefaultResolvedConfig = ResolvedForgeConfig;
    const conf = (await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_ts_conf'))) as DefaultResolvedConfig;
    expect(conf.buildIdentifier).to.equal('yml');
  });

  it('should resolve the TS file exports of forge.config.ts if config.forge does not exist and the TS config exists', async () => {
    type DefaultResolvedConfig = ResolvedForgeConfig;
    const conf = (await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_default_ts_conf'))) as DefaultResolvedConfig;
    expect(conf.buildIdentifier).to.equal('typescript');
  });

  it('should magically map properties to environment variables', async () => {
    type MappedConfig = ResolvedForgeConfig & {
      s3: {
        secretAccessKey?: string;
      };
      electronReleaseServer: {
        baseUrl: string;
      };
    };
    const conf = (await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_js_conf'))) as MappedConfig;
    expect(conf.s3.secretAccessKey).toBe(undefined);

    process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';
    process.env.ELECTRON_FORGE_ELECTRON_RELEASE_SERVER_BASE_URL = 'http://example.com';
    expect(conf.s3.secretAccessKey).toEqual('SecretyThing');
    expect(conf.electronReleaseServer.baseUrl).toEqual('http://example.com');
    delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
    delete process.env.ELECTRON_FORGE_ELECTRON_RELEASE_SERVER_BASE_URL;
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
    const conf = (await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_js_conf'))) as ResolveBIConfig;
    expect(conf.topLevelProp).to.equal('foo');
    expect(conf.sub).to.deep.equal({
      prop: {
        deep: {
          prop: 'bar',
        },
        inArray: ['arr', 'natural', 'array'],
      },
    });
  });

  it('should resolve undefined from fromBuildIdentifier if no value is provided', async () => {
    type ResolveUndefConfig = ResolvedForgeConfig & { topLevelUndef?: string };
    const conf = (await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_js_conf'))) as ResolveUndefConfig;
    expect(conf.topLevelUndef).to.equal(undefined);
  });

  it('should leave arrays intact', async () => {
    type NestedConfig = ResolvedForgeConfig & {
      sub: {
        prop: {
          inArray: string[];
        };
      };
    };
    const conf = (await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_js_conf'))) as NestedConfig;
    expect(Array.isArray(conf.sub.prop.inArray)).to.equal(true, 'original array should be recognized as array');
  });

  it('should leave regexps intact', async () => {
    type RegExpConfig = ResolvedForgeConfig & { regexp: RegExp };
    const conf = (await findConfig(path.resolve(__dirname, '../../test/fixture/dummy_js_conf'))) as RegExpConfig;
    expect(conf.regexp).to.be.instanceOf(RegExp);
    expect(conf.regexp.test('foo')).to.equal(true, 'regexp should match foo');
    expect(conf.regexp.test('bar')).to.equal(false, 'regexp should not match bar');
  });
});

describe('forgeConfigIsValidFilePath', () => {
  it('succeeds for a file extension-less path', async () => {
    const fixturePath = path.resolve(__dirname, '../../test/fixture/dummy_js_conf/');
    await expect(forgeConfigIsValidFilePath(fixturePath, 'forge.different.config')).resolves.toEqual(true);
  });

  it('fails when a file is nonexistent', async () => {
    const fixturePath = path.resolve(__dirname, '../../test/fixture/dummy_js_conf/');
    await expect(forgeConfigIsValidFilePath(fixturePath, 'forge.nonexistent.config')).resolves.toEqual(false);
  });
});

describe('renderConfigTemplate', () => {
  it('should import a JS file when a string starts with "require:"', () => {
    const dir = path.resolve(__dirname, '../../test/fixture/dummy_js_conf');
    const config = {
      foo: 'require:foo',
    };
    renderConfigTemplate(dir, {}, config);
    expect(config.foo).to.deep.equal({
      bar: {
        baz: 'quux',
      },
    });
  });
});

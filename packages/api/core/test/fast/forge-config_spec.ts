import path from 'path';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { expect } from 'chai';

import findConfig, { forgeConfigIsValidFilePath, renderConfigTemplate } from '../../src/util/forge-config';

const defaults = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [],
  publishers: [],
  plugins: [],
};

describe('forge-config', () => {
  it('should fail if the config is not an object or requirable path', async () => {
    await expect(findConfig(path.resolve(__dirname, '../fixture/bad_forge_config'))).to.eventually.be.rejectedWith(
      'Expected packageJSON.config.forge to be an object or point to a requirable JS file'
    );
  });

  it('should fail if the external config is not parseable', async () => {
    await expect(findConfig(path.resolve(__dirname, '../fixture/bad_external_forge_config'))).to.eventually.be.rejectedWith(/Unexpected token/);
  });

  it('should be set to the defaults if no Forge config is specified in package.json', async () => {
    const config = await findConfig(path.resolve(__dirname, '../fixture/no_forge_config'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (config as any).pluginInterface;
    expect(config).to.deep.equal(defaults);
  });

  it('should resolve the object in package.json with defaults if one exists', async () => {
    const config = await findConfig(path.resolve(__dirname, '../fixture/dummy_app'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (config as any).pluginInterface;
    expect(config).to.be.deep.equal({
      ...defaults,
      packagerConfig: {
        baz: {},
      },
      s3: {},
    });
  });

  it('should set a pluginInterface', async () => {
    const config = await findConfig(path.resolve(__dirname, '../fixture/dummy_app'));
    expect(config).to.have.property('pluginInterface');
  });

  it('should allow access to built-ins of proxied objects', async () => {
    // Why: This needs to get refactored anyway.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.packagerConfig.baz.hasOwnProperty).to.be.a('function');
    process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';
    // eslint-disable-next-line no-prototype-builtins
    expect(conf.s3.hasOwnProperty('secretAccessKey')).to.equal(true);
    delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
  });

  it('should allow overwrite of properties in proxied objects', async () => {
    // Why: This needs to get refactored anyway.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
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
    expect(Object.getOwnPropertyDescriptor(conf.s3, 'secretAccessKey')).to.be.deep.equal(descriptor);
    expect(() => {
      conf.s3.secretAccessKey = 'bar';
    }).to.not.throw();
    expect(conf.s3.secretAccessKey).to.equal('bar');
    delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
  });

  it('should resolve the JS file exports in config.forge points to a JS file', async () => {
    const config = JSON.parse(JSON.stringify(await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'))));
    delete config.pluginInterface;
    delete config.sub;
    delete config.topLevelProp;
    delete config.topLevelUndef;
    delete config.regexp;
    expect(config).to.be.deep.equal({
      ...defaults,
      buildIdentifier: 'beta',
      packagerConfig: { foo: 'bar', baz: {} },
      s3: {},
      electronReleaseServer: {},
    });
  });

  it('should resolve the JS file exports in config.forge points to a JS file and maintain functions', async () => {
    type MagicFunctionConfig = ResolvedForgeConfig & { magicFn: () => string };
    const conf = (await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'))) as MagicFunctionConfig;
    expect(conf.magicFn).to.be.a('function');
    expect(conf.magicFn()).to.be.equal('magic result');
  });

  it('should resolve the JS file exports of forge.config.js if config.forge does not exist ', async () => {
    type DefaultResolvedConfig = ResolvedForgeConfig & { defaultResolved: boolean };
    const conf = (await findConfig(path.resolve(__dirname, '../fixture/dummy_default_js_conf'))) as DefaultResolvedConfig;
    expect(conf.buildIdentifier).to.equal('default');
    expect(conf.defaultResolved).to.equal(true);
  });

  it(`should resolve the yml config from forge.config.yml if it's specified in config.forge`, async () => {
    type DefaultResolvedConfig = ResolvedForgeConfig;
    const conf = (await findConfig(path.resolve(__dirname, '../fixture/dummy_ts_conf'))) as DefaultResolvedConfig;
    expect(conf.buildIdentifier).to.equal('yml');
  });

  it('should resolve the TS file exports of forge.config.ts if config.forge does not exist and the TS config exists', async () => {
    type DefaultResolvedConfig = ResolvedForgeConfig;
    const conf = (await findConfig(path.resolve(__dirname, '../fixture/dummy_default_ts_conf'))) as DefaultResolvedConfig;
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
    const conf = (await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'))) as MappedConfig;
    expect(conf.s3.secretAccessKey).to.equal(undefined);

    process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';
    process.env.ELECTRON_FORGE_ELECTRON_RELEASE_SERVER_BASE_URL = 'http://example.com';
    expect(conf.s3.secretAccessKey).to.equal('SecretyThing');
    expect(conf.electronReleaseServer.baseUrl).to.equal('http://example.com');
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
    const conf = (await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'))) as ResolveBIConfig;
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
    const conf = (await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'))) as ResolveUndefConfig;
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
    const conf = (await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'))) as NestedConfig;
    expect(Array.isArray(conf.sub.prop.inArray)).to.equal(true, 'original array should be recognized as array');
  });

  it('should leave regexps intact', async () => {
    type RegExpConfig = ResolvedForgeConfig & { regexp: RegExp };
    const conf = (await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'))) as RegExpConfig;
    expect(conf.regexp).to.be.instanceOf(RegExp);
    expect(conf.regexp.test('foo')).to.equal(true, 'regexp should match foo');
    expect(conf.regexp.test('bar')).to.equal(false, 'regexp should not match bar');
  });

  describe('forgeConfigIsValidFilePath', () => {
    it('succeeds for a file extension-less path', async () => {
      await expect(forgeConfigIsValidFilePath(path.resolve(__dirname, '../fixture/dummy_js_conf/'), 'forge.different.config')).to.eventually.equal(true);
    });

    it('fails when a file is nonexistent', async () => {
      await expect(forgeConfigIsValidFilePath(path.resolve(__dirname, '../fixture/dummy_js_conf/'), 'forge.nonexistent.config')).to.eventually.equal(false);
    });
  });

  describe('renderConfigTemplate', () => {
    it('should import a JS file when a string starts with "require:"', () => {
      const dir = path.resolve(__dirname, '../fixture/dummy_js_conf');
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
});

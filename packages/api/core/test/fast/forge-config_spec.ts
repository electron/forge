import { expect } from 'chai';
import { IForgeResolvablePublisher } from '@electron-forge/shared-types';
import path from 'path';

import findConfig, { forgeConfigIsValidFilePath, renderConfigTemplate, setInitialForgeConfig } from '../../src/util/forge-config';

const defaults = {
  packagerConfig: {},
  electronRebuildConfig: {},
  makers: [],
  publishers: [],
  plugins: [],
};

function findPublisher(
  publishers: IForgeResolvablePublisher[],
  publisherName: string,
): IForgeResolvablePublisher | undefined {
  return publishers.find(
    (publisher: IForgeResolvablePublisher) => publisher.name === publisherName,
  );
}

describe('forge-config', () => {
  it('should fail if the config is not an object or requirable path', async () => {
    await expect(findConfig(path.resolve(__dirname, '../fixture/bad_forge_config'))).to.eventually.be.rejectedWith('Expected packageJSON.config.forge to be an object or point to a requirable JS file');
  });

  it('should fail if the external config is not parseable', async () => {
    await expect(findConfig(path.resolve(__dirname, '../fixture/bad_external_forge_config'))).to.eventually.be.rejectedWith(/bad.js: Unexpected token/);
  });

  it('should be set to the defaults if no Forge config is specified in package.json', async () => {
    const config = await findConfig(path.resolve(__dirname, '../fixture/no_forge_config'));
    delete (config as any).pluginInterface;
    expect(config).to.deep.equal(defaults);
  });

  it('should resolve the object in package.json with defaults if one exists', async () => {
    const config = await findConfig(path.resolve(__dirname, '../fixture/dummy_app'));
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
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.packagerConfig.baz.hasOwnProperty).to.be.a('function');

    process.env.ELECTRON_FORGE_PUBLISHER_S3_SECRET_ACCESS_KEY = 'SecretyThing';

    const s3Publisher = findPublisher(conf.publishers, '@electron-forge/publisher-s3');
    expect(s3Publisher).to.not.equal(undefined);

    // eslint-disable-next-line no-prototype-builtins
    expect(s3Publisher!.config.hasOwnProperty('secretAccessKey')).to.equal(true);
    delete process.env.ELECTRON_FORGE_PUBLISHER_S3_SECRET_ACCESS_KEY;
  });

  it('should allow overwrite of properties in proxied objects', async () => {
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.packagerConfig.baz.hasOwnProperty).to.be.a('function');
    expect(() => { conf.packagerConfig.baz = 'bar'; }).to.not.throw();

    process.env.ELECTRON_FORGE_PUBLISHER_S3_SECRET_ACCESS_KEY = 'SecretyThing';

    const descriptor = {
      writable: true, enumerable: true, configurable: true, value: 'SecretyThing',
    };

    const s3Publisher = findPublisher(conf.makers, '@electron-forge/publisher-s3');
    expect(s3Publisher).to.not.equal(undefined);

    expect(Object.getOwnPropertyDescriptor(s3Publisher!.config, 'secretAccessKey')).to.be.deep.equal(descriptor);
    expect(() => { s3Publisher!.config.secretAccessKey = 'bar'; }).to.not.throw();
    expect(s3Publisher?.config.secretAccessKey).to.equal('bar');
    delete process.env.ELECTRON_FORGE_PUBLISHER_S3_SECRET_ACCESS_KEY;
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
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.magicFn).to.be.a('function');
    expect(conf.magicFn()).to.be.equal('magic result');
  });

  it('should resolve the JS file exports of forge.config.js if config.forge does not exist points', async () => {
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_default_js_conf'));
    expect(conf.buildIdentifier).to.equal('default');
    expect(conf.defaultResolved).to.equal(true);
  });

  it('should magically map properties to environment variables', async () => {
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.s3.secretAccessKey).to.equal(undefined);

    process.env.ELECTRON_FORGE_PUBLISHER_S3_SECRET_ACCESS_KEY = 'SecretyThing';
    process.env.ELECTRON_FORGE_PUBLISHER_ELECTRON_RELEASE_SERVER_BASE_URL = 'http://example.com';

    const s3Publisher = findPublisher(conf.publishers, '@electron-forge/publisher-s3');
    expect(s3Publisher).to.not.equal(undefined);

    const ersPublisher = findPublisher(conf.publishers, '@electron-forge/publisher-electron-release-server');
    expect(ersPublisher).to.not.equal(undefined);

    expect(s3Publisher?.config?.secretAccessKey).to.equal('SecretyThing');
    expect(ersPublisher?.config?.baseUrl).to.equal('http://example.com');
    delete process.env.ELECTRON_FORGE_PUBLISHER_S3_SECRET_ACCESS_KEY;
    delete process.env.ELECTRON_FORGE_PUBLISHER_ELECTRON_RELEASE_SERVER_BASE_URL;
  });

  it('should resolve values fromBuildIdentifier', async () => {
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.topLevelProp).to.equal('foo');
    expect(conf.sub).to.deep.equal({
      prop: {
        deep: {
          prop: 'bar',
        },
        inArray: [
          'arr',
          'natural',
          'array',
        ],
      },
    });
  });

  it('should resolve undefined from fromBuildIdentifier if no value is provided', async () => {
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.topLevelUndef).to.equal(undefined);
  });

  it('should leave arrays intact', async () => {
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(Array.isArray(conf.sub.prop.inArray)).to.equal(true, 'original array should be recognized as array');
  });

  it('should leave regexps intact', async () => {
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
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

  describe('setInitialForgeConfig', () => {
    it('should normalize hyphens in maker names to underscores', () => {
      const packageJSON = {
        name: 'foo-bar',
        config: {
          forge: {
            makers: [
              {
                name: '@electron-forge/maker-test',
                config: {
                  name: 'will be overwritten',
                },
              },
            ],
          },
        },
      };
      setInitialForgeConfig(packageJSON);
      expect(packageJSON.config.forge.makers[0].config.name).to.equal('foo_bar');
    });

    it('should handle when package.json name is not set', () => {
      const packageJSON = {
        config: {
          forge: {
            makers: [
              {
                name: '@electron-forge/maker-test',
                config: {
                  name: 'will be overwritten',
                },
              },
            ],
          },
        },
      };
      setInitialForgeConfig(packageJSON);
      expect(packageJSON.config.forge.makers[0].config.name).to.equal('');
    });
  });
});

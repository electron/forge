import { expect } from 'chai';
import path from 'path';

import findConfig from '../../src/util/forge-config';

const defaults = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [],
  publishers: [],
  plugins: [],
};

describe('forge-config', () => {
  it('should resolve the object in package.json with defaults  if one exists', async () => {
    const config = await findConfig(path.resolve(__dirname, '../fixture/dummy_app'));
    delete config.pluginInterface;
    expect(config).to.be.deep.equal(Object.assign({}, defaults, {
      packagerConfig: {
        baz: {},
      },
      s3: {},
    }));
  });

  it('should set a pluginInterface', async () => {
    const config = await findConfig(path.resolve(__dirname, '../fixture/dummy_app'));
    expect(config).to.have.property('pluginInterface');
  });

  it('should allow access to built-ins of proxied objects', async () => {
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.packagerConfig.baz.hasOwnProperty).to.be.a('function');
    process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';
    // eslint-disable-next-line no-prototype-builtins
    expect(conf.s3.hasOwnProperty('secretAccessKey')).to.equal(true);
    delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
  });

  it('should allow overwrite of properties in proxied objects', async () => {
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.packagerConfig.baz.hasOwnProperty).to.be.a('function');
    expect(() => { conf.packagerConfig.baz = 'bar'; }).to.not.throw();
    process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';

    const descriptor = { writable: true, enumerable: true, configurable: true, value: 'SecretyThing' };
    expect(Object.getOwnPropertyDescriptor(conf.s3, 'secretAccessKey')).to.be.deep.equal(descriptor);
    expect(() => { conf.s3.secretAccessKey = 'bar'; }).to.not.throw();
    expect(conf.s3.secretAccessKey).to.equal('bar');
    delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
  });


  it('should resolve the JS file exports in config.forge points to a JS file', async () => {
    const config = JSON.parse(JSON.stringify(await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'))));
    delete config.pluginInterface;
    expect(config).to.be.deep.equal(Object.assign({}, defaults, {
      packagerConfig: { foo: 'bar', baz: {} },
      s3: {},
      electronReleaseServer: {},
    }));
  });

  it('should resolve the JS file exports in config.forge points to a JS file and maintain functions', async () => {
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.magicFn).to.be.a('function');
    expect(conf.magicFn()).to.be.equal('magic result');
  });

  it('should magically map properties to environment variables', async () => {
    const conf: any = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.s3.secretAccessKey).to.equal(undefined);

    process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';
    process.env.ELECTRON_FORGE_ELECTRON_RELEASE_SERVER_BASE_URL = 'http://example.com';
    expect(conf.s3.secretAccessKey).to.equal('SecretyThing');
    expect(conf.electronReleaseServer.baseUrl).to.equal('http://example.com');
    delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
    delete process.env.ELECTRON_FORGE_ELECTRON_RELEASE_SERVER_BASE_URL;
  });
});

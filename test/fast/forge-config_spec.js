import { expect } from 'chai';
import path from 'path';

import findConfig from '../../src/util/forge-config';

const defaults = {
  make_targets: {
    win32: ['squirrel', 'appx'],
    darwin: ['zip'],
    linux: ['deb', 'rpm'],
    mas: ['zip'],
  },
  electronInstallerDMG: {},
  electronPackagerConfig: {},
  electronWinstallerConfig: {},
  electronInstallerDebian: {},
  electronInstallerRedhat: {},
  publish_targets: {
    win32: ['github'],
    darwin: ['github'],
    linux: ['github'],
    mas: ['github'],
  },
  github_repository: {},
  s3: {},
  electronReleaseServer: {},
};

describe('forge-config', () => {
  it('should resolve the object in package.json with defaults  if one exists', async () => {
    expect(await findConfig(path.resolve(__dirname, '../fixture/dummy_app'))).to.be.deep.equal(Object.assign({}, defaults, {
      electronWinstallerConfig: { windows: 'magic' },
      windowsStoreConfig: { packageName: 'test' },
      github_repository: {
        name: 'project',
        owner: 'dummy',
      },
    }));
  });

  it('should allow access to built-ins of proxied objects', async () => {
    const conf = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.electronPackagerConfig.baz.hasOwnProperty).to.be.a('function');
    process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';
    // eslint-disable-next-line no-prototype-builtins
    expect(conf.s3.hasOwnProperty('secretAccessKey')).to.equal(true);
    delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
  });

  it('should allow overwrite of properties in proxied objects', async () => {
    const conf = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.electronPackagerConfig.baz.hasOwnProperty).to.be.a('function');
    expect(() => { conf.electronPackagerConfig.baz = 'bar'; }).to.not.throw();
    process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';

    const descriptor = { writable: true, enumerable: true, configurable: true, value: 'SecretyThing' };
    expect(Object.getOwnPropertyDescriptor(conf.s3, 'secretAccessKey')).to.be.deep.equal(descriptor);
    expect(() => { conf.s3.secretAccessKey = 'bar'; }).to.not.throw();
    expect(conf.s3.secretAccessKey).to.equal('bar');
    delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
  });


  it('should resolve the JS file exports in config.forge points to a JS file', async () => {
    expect(JSON.parse(JSON.stringify(await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'))))).to.be.deep.equal(Object.assign({}, defaults, {
      electronPackagerConfig: { foo: 'bar', baz: {} },
    }));
  });

  it('should resolve the JS file exports in config.forge points to a JS file and maintain functions', async () => {
    const conf = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.magicFn).to.be.a('function');
    expect(conf.magicFn()).to.be.equal('magic result');
  });

  it('should magically map properties to environment variables', async () => {
    const conf = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.s3.secretAccessKey).to.equal(undefined);

    process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY = 'SecretyThing';
    process.env.ELECTRON_FORGE_ELECTRON_RELEASE_SERVER_BASE_URL = 'http://example.com';
    expect(conf.s3.secretAccessKey).to.equal('SecretyThing');
    expect(conf.electronReleaseServer.baseUrl).to.equal('http://example.com');
    delete process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY;
    delete process.env.ELECTRON_FORGE_ELECTRON_RELEASE_SERVER_BASE_URL;
  });
});

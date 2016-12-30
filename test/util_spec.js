import { expect } from 'chai';
import path from 'path';

import requireSearch from '../src/util/require-search';
import resolveDir from '../src/util/resolve-dir';
import findConfig from '../src/util/forge-config';

describe('resolve-dir', () => {
  it('should return null if a valid dir can not be found', async () => {
    expect(await resolveDir('/foo/var/fake')).to.be.equal(null);
  });

  it('should return a directory if it finds a node module', async () => {
    expect(await resolveDir(path.resolve(__dirname, 'fixture/dummy_app/foo'))).to.not.be.equal(null);
    expect(await resolveDir(path.resolve(__dirname, 'fixture/dummy_app/foo'))).to.be.equal(path.resolve(__dirname, 'fixture/dummy_app'));
  });
});

const defaults = {
  make_targets: {
    win32: ['squirrel'],
    darwin: ['zip'],
    linux: ['deb', 'rpm'],
    mas: ['zip'],
  },
  electronInstallerDMG: {},
  electronPackagerConfig: {},
  electronWinstallerConfig: {},
  electronInstallerDebian: {},
  electronInstallerRedhat: {},
};

describe('forge-config', () => {
  it('should resolve the object in package.json with defaults  if one exists', async () => {
    expect(await findConfig(path.resolve(__dirname, 'fixture/dummy_app'))).to.be.deep.equal(Object.assign({}, defaults, {
      electronWinstallerConfig: { windows: 'magic' },
    }));
  });

  it('should resolve the JS file exports in config.forge points to a JS file', async () => {
    expect(JSON.parse(JSON.stringify(await findConfig(path.resolve(__dirname, 'fixture/dummy_js_conf'))))).to.be.deep.equal(Object.assign({}, defaults, {
      electronPackagerConfig: { foo: 'bar' },
    }));
  });

  it('should resolve the JS file exports in config.forge points to a JS file and maintain functions', async () => {
    const conf = await findConfig(path.resolve(__dirname, 'fixture/dummy_js_conf'));
    expect(conf.magicFn).to.be.a('function');
    expect(conf.magicFn()).to.be.equal('magic result');
  });
});

describe('require-search', () => {
  it('should resolve undefined if no file exists', () => {
    const resolved = requireSearch(__dirname, ['../src/util/wizard-secrets']);
    expect(resolved).to.equal(undefined);
  });

  it('should resolve a file if it exists', () => {
    const resolved = requireSearch(__dirname, ['../src/util/forge-config']);
    expect(resolved).to.equal(findConfig);
  });
});

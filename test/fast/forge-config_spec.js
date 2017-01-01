import { expect } from 'chai';
import path from 'path';

import findConfig from '../../src/util/forge-config';

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
    expect(await findConfig(path.resolve(__dirname, '../fixture/dummy_app'))).to.be.deep.equal(Object.assign({}, defaults, {
      electronWinstallerConfig: { windows: 'magic' },
    }));
  });

  it('should resolve the JS file exports in config.forge points to a JS file', async () => {
    expect(JSON.parse(JSON.stringify(await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'))))).to.be.deep.equal(Object.assign({}, defaults, {
      electronPackagerConfig: { foo: 'bar' },
    }));
  });

  it('should resolve the JS file exports in config.forge points to a JS file and maintain functions', async () => {
    const conf = await findConfig(path.resolve(__dirname, '../fixture/dummy_js_conf'));
    expect(conf.magicFn).to.be.a('function');
    expect(conf.magicFn()).to.be.equal('magic result');
  });
});

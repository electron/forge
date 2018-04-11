import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

chai.use(chaiAsPromised);

describe('MakerDMG', () => {
  let MakerDMG;
  let ensureFileStub;
  let eidStub;
  let renameStub;
  let config;
  let maker;
  let createMaker;

  const dir = '/my/test/dir/out';
  const makeDir = '/my/test/dir/make';
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(() => {
    ensureFileStub = stub().returns(Promise.resolve());
    eidStub = stub().callsArg(1);
    renameStub = stub().returns(Promise.resolve());
    config = {};

    MakerDMG = proxyquire.noPreserveCache().noCallThru().load('../src/MakerDMG', {
      '../../util/ensure-output': { ensureFile: ensureFileStub },
      'electron-installer-dmg': eidStub,
      'fs-extra': {
        rename: renameStub,
      },
    }).default;
    createMaker = () => {
      maker = new MakerDMG(config);
      maker.ensureFile = ensureFileStub;
    };
    createMaker();
  });

  it('should pass through correct defaults', async () => {
    await maker.make({ dir, makeDir, appName, targetArch, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      overwrite: true,
      name: appName,
      appPath: path.resolve(`${dir}/My Test App.app`),
      out: path.resolve(`${dir.substr(0, dir.length - 4)}/make`),
    });
  });

  it('should attempt to rename the DMG file if no custom name is set', async () => {
    await maker.make({ dir, makeDir, appName, targetArch, packageJSON });
    expect(renameStub.callCount).to.equal(1);
    expect(renameStub.firstCall.args[1]).to.include('1.2.3');
  });

  it('should rename the DMG file to include the version if no custom name is set', async () => {
    await maker.make({ dir, makeDir, appName, targetArch, packageJSON });
    expect(renameStub.firstCall.args[1]).to.include('1.2.3');
  });

  it('should not attempt to rename the DMG file if a custom name is set', async () => {
    config.name = 'foobar';
    createMaker();
    await maker.make({ dir, makeDir, appName, targetArch, packageJSON });
    expect(renameStub.callCount).to.equal(0);
  });
});

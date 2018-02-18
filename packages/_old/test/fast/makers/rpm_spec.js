import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

chai.use(chaiAsPromised);

describe('rpm maker', () => {
  let rpmModule;
  let rpmMaker;
  let eidStub;
  let ensureFileStub;
  let forgeConfig;

  const dir = '/my/test/dir/out';
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(() => {
    ensureFileStub = stub().returns(Promise.resolve());
    eidStub = stub().callsArg(1);
    forgeConfig = { electronInstallerRedhat: {} };

    rpmModule = proxyquire.noPreserveCache().noCallThru().load('../../../src/makers/linux/rpm', {
      './config-fn': config => config,
      '../../util/ensure-output': { ensureFile: ensureFileStub },
      'electron-installer-redhat': eidStub,
    });
    rpmMaker = rpmModule.default;
  });

  it('should pass through correct defaults', async () => {
    await rpmMaker({ dir, appName, targetArch, forgeConfig, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: rpmModule.rpmArch(process.arch),
      options: {},
      src: dir,
      dest: path.resolve(dir, '..', 'make'),
    });
  });

  it('should have config cascade correctly', async () => {
    forgeConfig.electronInstallerRedhat = {
      arch: 'overridden',
      options: {
        productName: 'Redhat',
      },
    };

    await rpmMaker({ dir, appName, targetArch, forgeConfig, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: rpmModule.rpmArch(process.arch),
      options: {
        productName: 'Redhat',
      },
      src: dir,
      dest: path.resolve(dir, '..', 'make'),
    });
  });
});

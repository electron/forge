import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

chai.use(chaiAsPromised);

describe('deb maker', () => {
  let debModule;
  let debMaker;
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
    forgeConfig = { electronInstallerDebian: {} };

    debModule = proxyquire.noPreserveCache().noCallThru().load('../../../src/makers/linux/deb', {
      './config-fn': config => config,
      '../../util/ensure-output': { ensureFile: ensureFileStub },
      'electron-installer-debian': eidStub,
    });
    debMaker = debModule.default;
  });

  it('should pass through correct defaults', async () => {
    await debMaker({ dir, appName, targetArch, forgeConfig, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: debModule.debianArch(process.arch),
      options: {},
      src: dir,
      dest: path.resolve(dir, '..', 'make'),
    });
  });

  it('should have config cascade correctly', async () => {
    forgeConfig.electronInstallerDebian = {
      arch: 'overridden',
      options: {
        productName: 'Debian',
      },
    };

    await debMaker({ dir, appName, targetArch, forgeConfig, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: debModule.debianArch(process.arch),
      options: {
        productName: 'Debian',
      },
      src: dir,
      dest: path.resolve(dir, '..', 'make'),
    });
  });
});

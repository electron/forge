import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

chai.use(chaiAsPromised);

describe('snap maker', () => {
  let snapModule;
  let snapMaker;
  let eisStub;
  let ensureDirectoryStub;
  let forgeConfig;

  const dir = '/my/test/dir/out/foo-linux-x64';
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(() => {
    ensureDirectoryStub = stub().returns(Promise.resolve());
    eisStub = stub().resolves('/my/test/dir/out/make/foo_0.0.1_amd64.snap');
    forgeConfig = { electronInstallerSnap: {} };

    snapModule = proxyquire.noPreserveCache().noCallThru().load('../../../src/makers/linux/snap', {
      './config-fn': config => config,
      '../../util/ensure-output': { ensureDirectory: ensureDirectoryStub },
      'electron-installer-snap': eisStub,
    });
    snapMaker = snapModule.default;
  });

  it('should pass through correct defaults', async () => {
    await snapMaker({ dir, appName, targetArch, forgeConfig, packageJSON });
    const opts = eisStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: process.arch,
      src: dir,
      dest: path.resolve(dir, '..', 'make'),
    });
  });

  it('should have config cascade correctly', async () => {
    forgeConfig.electronInstallerSnap = {
      arch: 'overridden',
      description: 'Snap description',
    };

    await snapMaker({ dir, appName, targetArch, forgeConfig, packageJSON });
    const opts = eisStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: process.arch,
      src: dir,
      dest: path.resolve(dir, '..', 'make'),
      description: 'Snap description',
    });
  });
});

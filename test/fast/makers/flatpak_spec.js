import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

chai.use(chaiAsPromised);

describe('flatpak maker', () => {
  let flatpakModule;
  let flatpakMaker;
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
    forgeConfig = { electronInstallerFlatpak: {} };

    flatpakModule = proxyquire.noPreserveCache().noCallThru().load('../../../src/makers/linux/flatpak', {
      './config-fn': config => config,
      '../../util/ensure-output': { ensureFile: ensureFileStub },
      'electron-installer-flatpak': eidStub,
    });
    flatpakMaker = flatpakModule.default;
  });

  it('should pass through correct defaults', async () => {
    await flatpakMaker({ dir, appName, targetArch, forgeConfig, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: flatpakModule.flatpakArch(process.arch),
      options: {},
      src: dir,
      dest: path.resolve(dir, '..', 'make'),
    });
  });

  it('should have config cascade correctly', async () => {
    forgeConfig.electronInstallerFlatpak = {
      arch: 'overridden',
      options: {
        productName: 'Flatpak',
      },
    };

    await flatpakMaker({ dir, appName, targetArch, forgeConfig, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: flatpakModule.flatpakArch(process.arch),
      options: {
        productName: 'Flatpak',
      },
      src: dir,
      dest: path.resolve(dir, '..', 'make'),
    });
  });
});

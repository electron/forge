import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

chai.use(chaiAsPromised);

describe('MakerFlatpak', () => {
  let flatpakModule;
  let maker;
  let eidStub;
  let ensureDirectoryStub;
  let config;

  const dir = '/my/test/dir/out';
  const makeDir = '/make/dir';
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(() => {
    ensureDirectoryStub = stub().returns(Promise.resolve());
    eidStub = stub().callsArg(1);
    config = {};

    flatpakModule = proxyquire.noPreserveCache().noCallThru().load('../src/MakerFlatpak', {
      'fs-extra': { readdir: stub().returns(Promise.resolve([])) },
      'electron-installer-flatpak': eidStub,
    });
    maker = new flatpakModule.default(); // eslint-disable-line
    maker.ensureDirectory = ensureDirectoryStub;
  });

  it('should pass through correct defaults', async () => {
    await maker.make({ dir, makeDir, appName, targetArch, config, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: flatpakModule.flatpakArch(process.arch),
      src: dir,
      dest: path.resolve(makeDir, 'flatpak'),
    });
  });

  it('should have config cascade correctly', async () => {
    config = {
      arch: 'overridden',
      options: {
        productName: 'Flatpak',
      },
    };

    await maker.make({ dir, makeDir, appName, targetArch, config, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: flatpakModule.flatpakArch(process.arch),
      options: {
        productName: 'Flatpak',
      },
      src: dir,
      dest: path.resolve(makeDir, 'flatpak'),
    });
  });
});

import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

chai.use(chaiAsPromised);

describe('MakerSnap', () => {
  let MakerSnapModule;
  let maker;
  let eisStub;
  let ensureDirectoryStub;
  let config;
  let createMaker;

  const dir = '/my/test/dir/out/foo-linux-x64';
  const makeDir = path.resolve('/make/dir');
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(() => {
    ensureDirectoryStub = stub().returns(Promise.resolve());
    eisStub = stub().resolves('/my/test/dir/out/make/foo_0.0.1_amd64.snap');
    config = {};

    MakerSnapModule = proxyquire.noPreserveCache().noCallThru().load('../src/MakerSnap', {
      'electron-installer-snap': eisStub,
    });
    createMaker = () => {
      maker = new MakerSnapModule.default(config); // eslint-disable-line
      maker.ensureDirectory = ensureDirectoryStub;
    };
    createMaker();
  });

  it('should pass through correct defaults', async () => {
    await maker.make({ dir, makeDir, appName, targetArch, packageJSON });
    const opts = eisStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: process.arch,
      src: dir,
      dest: path.resolve(makeDir, 'snap'),
    });
  });

  it('should have config cascade correctly', async () => {
    config = {
      arch: 'overridden',
      description: 'Snap description',
    };
    createMaker();

    await maker.make({ dir, makeDir, appName, targetArch, packageJSON });
    const opts = eisStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: process.arch,
      src: dir,
      dest: path.resolve(makeDir, 'snap'),
      description: 'Snap description',
    });
  });
});

import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

chai.use(chaiAsPromised);

describe('MakerRpm', () => {
  let rpmModule;
  let maker;
  let eidStub;
  let ensureFileStub;
  let config;

  const dir = '/my/test/dir/out';
  const makeDir = '/make/dir';
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(() => {
    ensureFileStub = stub().returns(Promise.resolve());
    eidStub = stub().callsArg(1);
    config = {};

    rpmModule = proxyquire.noPreserveCache().noCallThru().load('../src/MakerRpm', {
      'electron-installer-redhat': eidStub,
    });
    maker = new rpmModule.default(); // eslint-disable-line
    maker.ensureFile = ensureFileStub;
  });

  it('should pass through correct defaults', async () => {
    await maker.make({ dir, makeDir, appName, targetArch, config, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: rpmModule.rpmArch(process.arch),
      src: dir,
      dest: makeDir,
    });
  });

  it('should have config cascade correctly', async () => {
    config = {
      arch: 'overridden',
      options: {
        productName: 'Redhat',
      },
    };

    await maker.make({ dir, makeDir, appName, targetArch, config, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: rpmModule.rpmArch(process.arch),
      options: {
        productName: 'Redhat',
      },
      src: dir,
      dest: makeDir,
    });
  });

  describe('rpmArch', () => {
    it('should convert ia32 to i386', () => {
      expect(rpmModule.rpmArch('ia32')).to.equal('i386');
    });

    it('should convert x64 to x86_64', () => {
      expect(rpmModule.rpmArch('x64')).to.equal('x86_64');
    });

    it('should convert arm to armv6hl', () => {
      expect(rpmModule.rpmArch('arm')).to.equal('armv6hl');
    });

    it('should convert armv7l to armv7hl', () => {
      expect(rpmModule.rpmArch('armv7l')).to.equal('armv7hl');
    });

    it('should leave unknown values alone', () => {
      expect(rpmModule.rpmArch('foo')).to.equal('foo');
    });
  });
});

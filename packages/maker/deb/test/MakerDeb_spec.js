import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

chai.use(chaiAsPromised);

describe('MakerDeb', () => {
  let MakerDeb;
  let eidStub;
  let ensureFileStub;
  let config;
  let maker;
  let createMaker;

  const dir = '/my/test/dir/out';
  const makeDir = path.resolve('/foo/bar/make');
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(() => {
    ensureFileStub = stub().returns(Promise.resolve());
    eidStub = stub().resolves();
    config = {};

    MakerDeb = proxyquire.noPreserveCache().noCallThru().load('../src/MakerDeb', {
      'electron-installer-debian': eidStub,
    });
    createMaker = () => {
      maker = new MakerDeb.default(config); // eslint-disable-line
      maker.ensureFile = ensureFileStub;
    };
    createMaker();
  });

  it('should pass through correct defaults', async () => {
    await maker.make({ dir, makeDir, appName, targetArch, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: MakerDeb.debianArch(process.arch),
      options: {},
      src: dir,
      dest: makeDir,
    });
    expect(maker.config).to.deep.equal(config);
  });

  it('should have config cascade correctly', async () => {
    config = {
      arch: 'overridden',
      options: {
        productName: 'Debian',
      },
    };

    createMaker();

    await maker.make({ dir, makeDir, appName, targetArch, packageJSON });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: MakerDeb.debianArch(process.arch),
      options: {
        productName: 'Debian',
      },
      src: dir,
      dest: makeDir,
    });
  });

  describe('debianArch', () => {
    it('should convert ia32 to i386', () => {
      expect(MakerDeb.debianArch('ia32')).to.equal('i386');
    });

    it('should convert x64 to amd64', () => {
      expect(MakerDeb.debianArch('x64')).to.equal('amd64');
    });

    it('should convert arm to armel', () => {
      expect(MakerDeb.debianArch('arm')).to.equal('armel');
    });

    it('should convert armv7l to armhf', () => {
      expect(MakerDeb.debianArch('armv7l')).to.equal('armhf');
    });

    it('should leave unknown values alone', () => {
      expect(MakerDeb.debianArch('foo')).to.equal('foo');
    });
  });
});

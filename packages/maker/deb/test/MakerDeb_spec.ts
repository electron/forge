import path from 'path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch } from '@electron-forge/shared-types';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { SinonStub, stub } from 'sinon';

import { MakerDebConfig } from '../src/Config';
import { debianArch } from '../src/MakerDeb';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

class MakerImpl extends MakerBase<MakerDebConfig> {
  name = 'test';

  defaultPlatforms = [];
}

describe('MakerDeb', () => {
  let MakerDeb: typeof MakerImpl;
  let eidStub: SinonStub;
  let ensureDirectoryStub: SinonStub;
  let config: MakerDebConfig;
  let maker: MakerImpl;
  let createMaker: () => void;

  const dir = '/my/test/dir/out';
  const makeDir = path.resolve('/foo/bar/make');
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(() => {
    ensureDirectoryStub = stub().returns(Promise.resolve());
    eidStub = stub().returns({ packagePaths: ['/foo/bar.deb'] });
    config = {};

    MakerDeb = proxyquire.noPreserveCache().noCallThru().load('../src/MakerDeb', {
      'electron-installer-debian': eidStub,
    }).default;
    createMaker = () => {
      maker = new MakerDeb(config, []);
      maker.ensureDirectory = ensureDirectoryStub;
      maker.prepareConfig(targetArch as ForgeArch);
    };
    createMaker();
  });

  it('should pass through correct defaults', async () => {
    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: debianArch(process.arch as ForgeArch),
      options: {},
      src: dir,
      dest: path.join(makeDir, 'deb', process.arch),
      rename: undefined,
    });
    expect(maker.config).to.deep.equal(config);
  });

  it('should have config cascade correctly', async () => {
    config = {
      arch: 'overridden',
      options: {
        productName: 'Debian',
      },
    } as Record<string, unknown>;

    createMaker();

    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: debianArch(process.arch as ForgeArch),
      options: {
        productName: 'Debian',
      },
      src: dir,
      dest: path.join(makeDir, 'deb', process.arch),
      rename: undefined,
    });
  });

  describe('debianArch', () => {
    it('should convert ia32 to i386', () => {
      expect(debianArch('ia32')).to.equal('i386');
    });

    it('should convert x64 to amd64', () => {
      expect(debianArch('x64')).to.equal('amd64');
    });

    it('should convert arm to armel', () => {
      expect(debianArch('arm')).to.equal('armel');
    });

    it('should convert armv7l to armhf', () => {
      expect(debianArch('armv7l')).to.equal('armhf');
    });

    it('should leave unknown values alone', () => {
      expect(debianArch('foo' as ForgeArch)).to.equal('foo');
    });
  });
});

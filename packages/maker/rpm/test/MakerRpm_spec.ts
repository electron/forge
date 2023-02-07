import path from 'path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch } from '@electron-forge/shared-types';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { SinonStub, stub } from 'sinon';

import { MakerRpmConfig } from '../src/Config';
import { rpmArch } from '../src/MakerRpm';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

class MakerImpl extends MakerBase<MakerRpmConfig> {
  name = 'test';

  defaultPlatforms = [];
}

describe('MakerRpm', () => {
  let MakerRpm: typeof MakerImpl;
  let eirStub: SinonStub;
  let ensureDirectoryStub: SinonStub;
  let config: MakerRpmConfig;
  let maker: MakerImpl;
  let createMaker: () => void;

  const dir = '/my/test/dir/out';
  const makeDir = path.resolve('/make/dir');
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(() => {
    ensureDirectoryStub = stub().returns(Promise.resolve());
    eirStub = stub().returns(Promise.resolve({ packagePaths: ['/foo/bar.rpm'] }));
    config = {};

    MakerRpm = proxyquire.noPreserveCache().noCallThru().load('../src/MakerRpm', {
      'electron-installer-redhat': eirStub,
    }).default;
    createMaker = () => {
      maker = new MakerRpm(config);
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
    const opts = eirStub.firstCall.args[0];
    delete opts.rename;
    expect(opts).to.deep.equal({
      arch: rpmArch(process.arch as ForgeArch),
      src: dir,
      dest: path.join(makeDir, 'rpm', process.arch),
    });
  });

  it('should have config cascade correctly', async () => {
    config = {
      arch: 'overridden',
      options: {
        productName: 'Redhat',
      },
    } as MakerRpmConfig;
    createMaker();

    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    const opts = eirStub.firstCall.args[0];
    delete opts.rename;
    expect(opts).to.deep.equal({
      arch: rpmArch(process.arch as ForgeArch),
      options: {
        productName: 'Redhat',
      },
      src: dir,
      dest: path.join(makeDir, 'rpm', process.arch),
    });
  });

  describe('rpmArch', () => {
    it('should convert ia32 to i386', () => {
      expect(rpmArch('ia32')).to.equal('i386');
    });

    it('should convert x64 to x86_64', () => {
      expect(rpmArch('x64')).to.equal('x86_64');
    });

    it('should convert arm64 to aarch64', () => {
      expect(rpmArch('arm64')).to.equal('aarch64');
    });

    it('should convert arm to armv6hl', () => {
      expect(rpmArch('arm')).to.equal('armv6hl');
    });

    it('should convert armv7l to armv7hl', () => {
      expect(rpmArch('armv7l')).to.equal('armv7hl');
    });

    it('should leave unknown values alone', () => {
      expect(rpmArch('foo' as ForgeArch)).to.equal('foo');
    });
  });
});

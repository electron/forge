import MakerBase from '@electron-forge/maker-base';

import { expect } from 'chai';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub, SinonStub } from 'sinon';

import { ForgeArch } from '@electron-forge/shared-types';
import { MakerRpmConfig } from '../src/Config';
import { rpmArch } from '../src/MakerRpm';

class MakerImpl extends MakerBase<MakerRpmConfig> {
 name = 'test';

 defaultPlatforms = [];
}

describe('MakerRpm', () => {
  let rpmModule: typeof MakerImpl;
  let eirStub: SinonStub;
  let ensureFileStub: SinonStub;
  let config: MakerRpmConfig;
  let maker: MakerImpl;
  let createMaker: () => void;

  const dir = '/my/test/dir/out';
  const makeDir = path.resolve('/make/dir');
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(() => {
    ensureFileStub = stub().returns(Promise.resolve());
    eirStub = stub().resolves();
    config = {};

    rpmModule = proxyquire.noPreserveCache().noCallThru().load('../src/MakerRpm', {
      'electron-installer-redhat': eirStub,
    }).default;
    createMaker = () => {
      maker = new rpmModule(config); // eslint-disable-line
      maker.ensureFile = ensureFileStub;
      maker.prepareConfig(targetArch as any);
    };
    createMaker();
  });

  it('should pass through correct defaults', async () => {
    await (maker.make as any)({
      dir, makeDir, appName, targetArch, packageJSON,
    });
    const opts = eirStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: rpmArch(process.arch as ForgeArch),
      src: dir,
      dest: makeDir,
      rename: undefined,
    });
  });

  it('should have config cascade correctly', async () => {
    config = {
      arch: 'overridden',
      options: {
        productName: 'Redhat',
      },
    } as any;
    createMaker();

    await (maker.make as any)({
      dir, makeDir, appName, targetArch, packageJSON,
    });
    const opts = eirStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: rpmArch(process.arch as ForgeArch),
      options: {
        productName: 'Redhat',
      },
      src: dir,
      dest: makeDir,
      rename: undefined,
    });
  });

  describe('rpmArch', () => {
    it('should convert ia32 to i386', () => {
      expect(rpmArch('ia32')).to.equal('i386');
    });

    it('should convert x64 to x86_64', () => {
      expect(rpmArch('x64')).to.equal('x86_64');
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

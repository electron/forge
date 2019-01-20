import MakerBase from '@electron-forge/maker-base';

import { expect } from 'chai';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub, SinonStub } from 'sinon';

import { ForgeArch } from '@electron-forge/shared-types';
import { MakerDebConfig } from '../src/Config';
import { debianArch } from '../src/MakerDeb';

class MakerImpl extends MakerBase<MakerDebConfig> {
 name = 'test';

 defaultPlatforms = [];
}

describe('MakerDeb', () => {
  let MakerDeb: typeof MakerImpl;
  let eidStub: SinonStub;
  let ensureFileStub: SinonStub;
  let config: MakerDebConfig;
  let maker: MakerImpl;
  let createMaker: () => void;

  const dir = '/my/test/dir/out';
  const makeDir = path.resolve('/foo/bar/make');
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(() => {
    ensureFileStub = stub().returns(Promise.resolve());
    eidStub = stub().resolves();
    (eidStub as any).transformVersion = (version: string) => version;
    config = {};

    MakerDeb = proxyquire.noPreserveCache().noCallThru().load('../src/MakerDeb', {
      'electron-installer-debian': eidStub,
    }).default;
    createMaker = () => {
      maker = new MakerDeb(config, []); // eslint-disable-line
      maker.ensureFile = ensureFileStub;
      maker.prepareConfig(targetArch as any);
    };
    createMaker();
  });

  it('should pass through correct defaults', async () => {
    await (maker.make as any)({
      dir, makeDir, appName, targetArch, packageJSON,
    });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: debianArch(process.arch as ForgeArch),
      options: {},
      src: dir,
      dest: makeDir,
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
    } as any;

    createMaker();

    await (maker.make as any)({
      dir, makeDir, appName, targetArch, packageJSON,
    });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: debianArch(process.arch as ForgeArch),
      options: {
        productName: 'Debian',
      },
      src: dir,
      dest: makeDir,
      rename: undefined,
    });
  });

  if (process.platform === 'linux') {
    it('should return the proper pre-release version in the outPath', async () => {
      (eidStub as any).transformVersion = require('electron-installer-debian').transformVersion;
      packageJSON.version = '1.2.3-beta.4';
      const outPath = await (maker.make as any)({
        dir, makeDir, appName, targetArch, packageJSON,
      });
      expect(outPath).to.match(/1\.2\.3~beta\.4/);
    });
  }

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

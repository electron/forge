import MakerBase from '@electron-forge/maker-base';

import { expect } from 'chai';
import 'chai-as-promised';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub, SinonStub } from 'sinon';

import { ForgeArch } from '@electron-forge/shared-types';
import { flatpakArch } from '../src/MakerFlatpak';
import { MakerFlatpakConfig } from '../src/Config';

class MakerImpl extends MakerBase<MakerFlatpakConfig> {
 name = 'test';

 defaultPlatforms = [];
}

describe('MakerFlatpak', () => {
  let flatpakModule: typeof MakerImpl;
  let maker: MakerImpl;
  let eidStub: SinonStub;
  let ensureDirectoryStub: SinonStub;
  let config: MakerFlatpakConfig;
  let createMaker: () => void;

  const dir = '/my/test/dir/out';
  const makeDir = path.resolve('/make/dir');
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
    }).default;
    createMaker = () => {
      maker = new flatpakModule(config); // eslint-disable-line
      maker.ensureDirectory = ensureDirectoryStub;
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
      arch: flatpakArch(process.arch as ForgeArch),
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
    } as any;
    createMaker();

    await (maker.make as any)({
      dir, makeDir, appName, targetArch, packageJSON,
    });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: flatpakArch(process.arch as ForgeArch),
      options: {
        productName: 'Flatpak',
      },
      src: dir,
      dest: path.resolve(makeDir, 'flatpak'),
    });
  });
});

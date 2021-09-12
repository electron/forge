import MakerBase, { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch } from '@electron-forge/shared-types';

import { expect } from 'chai';
import 'chai-as-promised';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub, SinonStub } from 'sinon';

import { flatpakArch } from '../src/MakerFlatpak';
import { MakerFlatpakConfig } from '../src/Config';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

class MakerImpl extends MakerBase<MakerFlatpakConfig> {
  name = 'test';

  defaultPlatforms = [];
}

describe('MakerFlatpak', () => {
  let MakerFlatpak: typeof MakerImpl;
  let maker: MakerImpl;
  let eifStub: SinonStub;
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
    eifStub = stub().resolves();
    config = {};

    MakerFlatpak = proxyquire
      .noPreserveCache()
      .noCallThru()
      .load('../src/MakerFlatpak', {
        'fs-extra': { readdir: stub().returns(Promise.resolve([])) },
        '@malept/electron-installer-flatpak': eifStub,
      }).default;
    createMaker = () => {
      maker = new MakerFlatpak(config);
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
    const opts = eifStub.firstCall.args[0];
    const expectedArch = flatpakArch(process.arch as ForgeArch);
    expect(opts).to.deep.equal({
      arch: expectedArch,
      src: dir,
      dest: path.resolve(makeDir, 'flatpak', expectedArch),
    });
  });

  it('should have config cascade correctly', async () => {
    config = {
      arch: 'overridden',
      options: {
        productName: 'Flatpak',
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
    const opts = eifStub.firstCall.args[0];
    const expectedArch = flatpakArch(process.arch as ForgeArch);
    expect(opts).to.deep.equal({
      arch: expectedArch,
      options: {
        productName: 'Flatpak',
      },
      src: dir,
      dest: path.resolve(makeDir, 'flatpak', expectedArch),
    });
  });
});

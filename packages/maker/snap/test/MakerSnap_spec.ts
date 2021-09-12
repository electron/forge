import { ForgeArch } from '@electron-forge/shared-types';
import MakerBase, { MakerOptions } from '@electron-forge/maker-base';

import { expect } from 'chai';
import path from 'path';
import proxyquire from 'proxyquire';
import { stub, SinonStub } from 'sinon';

import { MakerSnapConfig } from '../src/Config';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

class MakerImpl extends MakerBase<MakerSnapConfig> {
  name = 'test';

  defaultPlatforms = [];
}

describe('MakerSnap', () => {
  let MakerSnapModule: typeof MakerImpl;
  let maker: MakerImpl;
  let eisStub: SinonStub;
  let ensureDirectoryStub: SinonStub;
  let config: MakerSnapConfig;
  let createMaker: () => void;

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
    }).default;
    createMaker = () => {
      maker = new MakerSnapModule(config);
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
    const opts = eisStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: process.arch,
      src: dir,
      dest: path.resolve(makeDir, 'snap', process.arch),
    });
  });

  it('should have config cascade correctly', async () => {
    Object.assign(config, {
      arch: 'overridden',
      description: 'Snap description',
    } as Record<string, string>);
    createMaker();

    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    const opts = eisStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      arch: process.arch,
      src: dir,
      dest: path.resolve(makeDir, 'snap', process.arch),
      description: 'Snap description',
    });
  });
});

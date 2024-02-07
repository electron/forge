import path from 'path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { SinonStub, stub } from 'sinon';

import { MakerPKGConfig } from '../src/Config';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

class MakerImpl extends MakerBase<MakerPKGConfig> {
  name = 'test';

  defaultPlatforms = [];
}

describe('MakerPKG', () => {
  let MakerDMG: typeof MakerImpl;
  let ensureFileStub: SinonStub;
  let osxSignStub: SinonStub;
  let renameStub: SinonStub;
  let config: MakerPKGConfig;
  let maker: MakerImpl;
  let createMaker: () => Promise<void>;

  const dir = '/my/test/dir/out';
  const makeDir = '/my/test/dir/make';
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(async () => {
    ensureFileStub = stub().returns(Promise.resolve());
    osxSignStub = stub();
    renameStub = stub().returns(Promise.resolve());
    config = {};

    MakerDMG = proxyquire
      .noPreserveCache()
      .noCallThru()
      .load('../src/MakerPKG', {
        '../../util/ensure-output': { ensureFile: ensureFileStub },
        '@electron/osx-sign': {
          flatAsync: osxSignStub,
        },
        'fs-extra': {
          rename: renameStub,
        },
      }).default;
    createMaker = async () => {
      maker = new MakerDMG(config);
      maker.ensureFile = ensureFileStub;
      await maker.prepareConfig(targetArch);
    };
    await createMaker();
  });

  it('should pass through correct defaults', async () => {
    await (maker.make as MakeFunction)({
      packageJSON,
      dir,
      makeDir,
      appName,
      targetArch,
      targetPlatform: 'mas',
    });
    const opts = osxSignStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      app: path.resolve(`${dir}/My Test App.app`),
      pkg: path.resolve(`${dir.substr(0, dir.length - 4)}/make/My Test App-1.2.3-${targetArch}.pkg`),
      platform: 'mas',
    });
  });

  it('should throw an error on invalid platform', async () => {
    await expect(
      (maker.make as MakeFunction)({
        packageJSON,
        dir,
        makeDir,
        appName,
        targetArch,
        targetPlatform: 'win32',
      })
    ).to.eventually.be.rejectedWith('The pkg maker only supports targeting "mas" and "darwin" builds. You provided "win32".');
  });
});

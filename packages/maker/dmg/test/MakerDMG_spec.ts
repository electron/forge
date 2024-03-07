import path from 'path';

import { MakerBase, MakerOptions } from '@electron-forge/maker-base';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { SinonStub, stub } from 'sinon';

import { MakerDMGConfig } from '../src/Config';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

class MakerImpl extends MakerBase<MakerDMGConfig> {
  name = 'test';

  defaultPlatforms = [];
}

describe('MakerDMG', () => {
  let MakerDMG: typeof MakerImpl;
  let ensureFileStub: SinonStub;
  let eidStub: SinonStub;
  let renameStub: SinonStub;
  let config: MakerDMGConfig;
  let maker: MakerImpl;
  let createMaker: () => Promise<void>;

  const dir = '/my/test/dir/out';
  const makeDir = '/my/test/dir/make';
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };

  beforeEach(async () => {
    ensureFileStub = stub().returns(Promise.resolve());
    eidStub = stub().returns(Promise.resolve({ dmgPath: '/path/to/dmg' }));
    renameStub = stub().returns(Promise.resolve());
    config = {};

    MakerDMG = proxyquire
      .noPreserveCache()
      .noCallThru()
      .load('../src/MakerDMG', {
        '../../util/ensure-output': { ensureFile: ensureFileStub },
        'electron-installer-dmg': eidStub,
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
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    const opts = eidStub.firstCall.args[0];
    expect(opts).to.deep.equal({
      overwrite: true,
      name: `${appName}-${packageJSON.version}-${targetArch}.dmg`,
      appPath: path.resolve(`${dir}/My Test App.app`),
      out: path.resolve(`${dir.substr(0, dir.length - 4)}/make`),
    });
  });

  it('should not attempt to rename the DMG file if a custom name is set', async () => {
    config.name = 'foobar';
    await createMaker();
    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    expect(renameStub.callCount).to.equal(0);
  });
});

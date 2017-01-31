import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

chai.use(chaiAsPromised);

describe('start', () => {
  let start;
  let resolveStub;
  let spawnStub;

  beforeEach(() => {
    resolveStub = sinon.stub();
    spawnStub = sinon.stub();
    start = proxyquire.noCallThru().load('../../src/api/start', {
      '../util/resolve-dir': async dir => resolveStub(dir),
      '../util/read-package-json': () => Promise.resolve(require('../fixture/dummy_app/package.json')),
      '../util/rebuild': () => Promise.resolve(),
      child_process: {
        spawn: spawnStub,
      },
    }).default;
  });

  it('should spawn electron in the correct dir', async () => {
    resolveStub.returnsArg(0);
    await start({
      dir: __dirname,
      interactive: false,
    });
    expect(spawnStub.callCount).to.equal(1);
    expect(spawnStub.firstCall.args[0]).to.contain('electron');
    expect(spawnStub.firstCall.args[2]).to.have.property('cwd', __dirname);
    expect(spawnStub.firstCall.args[2].env).to.not.have.property('ELECTRON_ENABLE_LOGGING');
  });

  it('should enable electron logging if enableLogging=true', async () => {
    resolveStub.returnsArg(0);
    await start({
      dir: __dirname,
      interactive: false,
      enableLogging: true,
    });
    expect(spawnStub.callCount).to.equal(1);
    expect(spawnStub.firstCall.args[0]).to.contain('electron');
    expect(spawnStub.firstCall.args[2].env).to.have.property('ELECTRON_ENABLE_LOGGING', true);
  });

  it('should throw if no dir could be found', async () => {
    resolveStub.returns(null);

    await expect(start()).to.eventually.be.rejectedWith(
      'Failed to locate startable Electron application'
    );
  });

  it('should pass all args through to the spawned Electron instance', async () => {
    const args = ['magic_arg', 123, 'thingy'];
    resolveStub.returnsArg(0);
    spawnStub.returns(0);
    await start({
      dir: __dirname,
      interactive: false,
      args,
    });
    expect(spawnStub.callCount).to.equal(1);
    expect(spawnStub.firstCall.args[0]).to.contain('electron');
    expect(spawnStub.firstCall.args[1].slice(1)).to.deep.equal(args);
  });

  it('should resolve with a handle to the spawned instance', async () => {
    resolveStub.returnsArg(0);
    spawnStub.returns('child');

    await expect(start({
      dir: __dirname,
      interactive: false,
      enableLogging: true,
    })).to.eventually.equal('child');
  });
});

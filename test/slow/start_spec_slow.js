import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('start', () => {
  let start;
  let resolveStub;
  let spawnSpy;

  beforeEach(() => {
    resolveStub = sinon.stub();
    spawnSpy = sinon.spy();
    start = proxyquire.noCallThru().load('../../src/api/start', {
      '../util/resolve-dir': async dir => resolveStub(dir),
      '../util/read-package-json': () => Promise.resolve(require('../fixture/dummy_app/package.json')),
      '../util/rebuild': () => Promise.resolve(),
      child_process: {
        spawn: spawnSpy,
      },
    }).default;
  });

  it('should spawn electron in the correct dir', async () => {
    resolveStub.returnsArg(0);
    await start({
      dir: __dirname,
      interactive: false,
    });
    expect(spawnSpy.callCount).to.equal(1);
    expect(spawnSpy.firstCall.args[0]).to.contain('electron');
    expect(spawnSpy.firstCall.args[2]).to.have.property('cwd', __dirname);
    expect(spawnSpy.firstCall.args[2].env).to.not.have.property('ELECTRON_ENABLE_LOGGING');
  });

  it('should enable electron logging if enableLogging=true', async () => {
    resolveStub.returnsArg(0);
    await start({
      dir: __dirname,
      interactive: false,
      enableLogging: true,
    });
    expect(spawnSpy.callCount).to.equal(1);
    expect(spawnSpy.firstCall.args[0]).to.contain('electron');
    expect(spawnSpy.firstCall.args[2].env).to.have.property('ELECTRON_ENABLE_LOGGING', true);
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
    await start({
      dir: __dirname,
      interactive: false,
      args,
    });
    expect(spawnSpy.callCount).to.equal(1);
    expect(spawnSpy.firstCall.args[0]).to.contain('electron');
    expect(spawnSpy.firstCall.args[1].slice(1)).to.deep.equal(args);
  });
});

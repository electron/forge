import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

chai.use(chaiAsPromised);

describe('start', () => {
  let start;
  let packageJSON;
  let resolveStub;
  let spawnStub;
  let shouldOverride;

  beforeEach(() => {
    resolveStub = sinon.stub();
    spawnStub = sinon.stub();
    shouldOverride = false;
    packageJSON = require('../fixture/dummy_app/package.json');

    start = proxyquire.noCallThru().load('../../src/api/start', {
      '../util/forge-config': async () => ({
        pluginInterface: {
          overrideStartLogic: async () => shouldOverride,
          triggerHook: async () => false,
        },
      }),
      '../util/resolve-dir': async dir => resolveStub(dir),
      '../util/read-package-json': () => Promise.resolve(packageJSON),
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
    expect(spawnStub.firstCall.args[0]).to.equal(process.execPath);
    expect(spawnStub.firstCall.args[1][0]).to.contain(`electron${path.sep}cli`);
    expect(spawnStub.firstCall.args[2]).to.have.property('cwd', __dirname);
    expect(spawnStub.firstCall.args[2].env).to.not.have.property('ELECTRON_ENABLE_LOGGING');
  });

  it('should not spawn if a plugin overrides the start command', async () => {
    resolveStub.returnsArg(0);
    shouldOverride = true;
    await start({
      dir: __dirname,
      interactive: false,
    });
    expect(spawnStub.callCount).to.equal(0);
  });

  it("should pass electron '.' as the app path if not specified", async () => {
    resolveStub.returnsArg(0);
    await start({
      dir: __dirname,
    });
    expect(spawnStub.callCount).to.equal(1);
    expect(spawnStub.firstCall.args[0]).to.equal(process.execPath);
    expect(spawnStub.firstCall.args[1][0]).to.contain(`electron${path.sep}cli`);
    expect(spawnStub.firstCall.args[1][1]).to.equal('.');
  });

  it('should pass electron the app path if specified', async () => {
    resolveStub.returnsArg(0);
    await start({
      dir: __dirname,
      appPath: '/path/to/app.js',
    });
    expect(spawnStub.callCount).to.equal(1);
    expect(spawnStub.firstCall.args[0]).to.equal(process.execPath);
    expect(spawnStub.firstCall.args[1][0]).to.contain(`electron${path.sep}cli`);
    expect(spawnStub.firstCall.args[1][1]).to.equal('/path/to/app.js');
  });

  it('should enable electron logging if enableLogging=true', async () => {
    resolveStub.returnsArg(0);
    await start({
      dir: __dirname,
      interactive: false,
      enableLogging: true,
    });
    expect(spawnStub.callCount).to.equal(1);
    expect(spawnStub.firstCall.args[0]).to.equal(process.execPath);
    expect(spawnStub.firstCall.args[1][0]).to.contain(`electron${path.sep}cli`);
    expect(spawnStub.firstCall.args[2].env).to.have.property('ELECTRON_ENABLE_LOGGING', true);
  });

  it('should enable RUN_AS_NODE if runAsNode=true', async () => {
    resolveStub.returnsArg(0);
    await start({
      dir: __dirname,
      interactive: false,
      runAsNode: true,
    });
    expect(spawnStub.callCount).to.equal(1);
    expect(spawnStub.firstCall.args[2].env).to.have.property('ELECTRON_RUN_AS_NODE', true);
  });

  it('should disable RUN_AS_NODE if runAsNode=false', async () => {
    resolveStub.returnsArg(0);
    await start({
      dir: __dirname,
      interactive: false,
      runAsNode: false,
    });
    expect(spawnStub.callCount).to.equal(1);
    expect(spawnStub.firstCall.args[2].env).to.not.have.property('ELECTRON_RUN_AS_NODE');
  });

  it('should throw if no dir could be found', async () => {
    resolveStub.returns(null);

    await expect(start()).to.eventually.be.rejectedWith(
      'Failed to locate startable Electron application'
    );
  });

  it('should throw if no version is in package.json', async () => {
    resolveStub.returnsArg(0);
    packageJSON = Object.assign({}, packageJSON);
    delete packageJSON.version;
    await expect(start({
      dir: __dirname,
      interactive: false,
    })).to.eventually.be.rejectedWith(
      `Please set your application's 'version' in '${__dirname}/package.json'.`
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
    expect(spawnStub.firstCall.args[0]).to.equal(process.execPath);
    expect(spawnStub.firstCall.args[1].slice(2)).to.deep.equal(args);
  });

  it('should pass --inspect at the start of the args if inspect is set', async () => {
    const args = ['magic'];
    resolveStub.returnsArg(0);
    spawnStub.returns(0);
    await start({
      dir: __dirname,
      interactive: false,
      args,
      inspect: true,
    });
    expect(spawnStub.callCount).to.equal(1);
    expect(spawnStub.firstCall.args[0]).to.equal(process.execPath);
    expect(spawnStub.firstCall.args[1].slice(2)).to.deep.equal(['--inspect'].concat(args));
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

  describe('cli', () => {
    let argv;
    let childExitCode;
    let childStub;
    beforeEach(() => {
      argv = process.argv;
      childExitCode = 0;
      childStub = {
        on: (event, cb) => cb(childExitCode),
      };
    });

    it('should remove all "~" from args when in VSCode debug mode', (done) => {
      process.argv = [argv[0], '--vscode', '--', '--foo', 'bar', 'this arg exists'];
      proxyquire.noCallThru().load('../../src/electron-forge-start', {
        './api': {
          start: (startOptions) => {
            expect(startOptions.args).to.deep.equal(['--foo', 'bar', 'this arg exists']);
            done();
            return Promise.resolve(childStub);
          },
        },
      });
    });

    afterEach(() => {
      process.argv = argv;
    });
  });
});

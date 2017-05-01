import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import { Command } from 'commander';
import path from 'path';

chai.use(chaiAsPromised);

describe('electron-forge start', () => {
  let argv;
  let startStub;
  let runCommand;
  let childExitCode;
  let childStub;

  beforeEach(() => {
    ({ argv } = process);

    childExitCode = 0;
    childStub = {
      on: (event, cb) => cb(childExitCode),
    };
    startStub = sinon.stub().returns(Promise.resolve(childStub));

    runCommand = async (args = []) => {
      process.argv = ['node', 'electron-forge-start'].concat(args);
      return proxyquire.noCallThru().load('../../src/electron-forge-start', {
        commander: new Command(),
        './api': { start: startStub },
      });
    };
  });

  afterEach(() => {
    process.argv = argv;
  });

  it('should pass through correct defaults', async () => {
    await runCommand();
    expect(startStub.callCount).to.equal(1);
    expect(startStub.firstCall.args[0]).to.deep.equal({
      dir: process.cwd(),
      interactive: true,
      enableLogging: false,
      runAsNode: false,
    });
  });

  it('should handle an absolute project directory', async () => {
    await runCommand([path.join(process.cwd(), 'test', 'fixture', 'dummy_app')]);
    expect(startStub.callCount).to.equal(1);
    expect(startStub.firstCall.args[0]).to.deep.equal({
      dir: path.join(process.cwd(), 'test', 'fixture', 'dummy_app'),
      interactive: true,
      enableLogging: false,
      runAsNode: false,
    });
  });

  it('should handle a relative project directory', async () => {
    await runCommand([path.join('test', 'fixture', 'dummy_app')]);
    expect(startStub.callCount).to.equal(1);
    expect(startStub.firstCall.args[0]).to.deep.equal({
      dir: path.join(process.cwd(), 'test', 'fixture', 'dummy_app'),
      interactive: true,
      enableLogging: false,
      runAsNode: false,
    });
  });

  it('should handle an app path', async () => {
    await runCommand(['-p', path.join('foo', 'electron.js')]);
    expect(startStub.callCount).to.equal(1);
    expect(startStub.firstCall.args[0]).to.deep.equal({
      dir: process.cwd(),
      appPath: path.join('foo', 'electron.js'),
      interactive: true,
      enableLogging: false,
      runAsNode: false,
    });
  });

  it('should be able to enable logging', async () => {
    await runCommand(['-l']);
    expect(startStub.callCount).to.equal(1);
    expect(startStub.firstCall.args[0]).to.deep.equal({
      dir: process.cwd(),
      enableLogging: true,
      interactive: true,
      runAsNode: false,
    });
  });

  it('should handle app args', async () => {
    await runCommand(['-l', '---', '-a', 'foo', '-l']);
    expect(startStub.callCount).to.equal(1);
    expect(startStub.firstCall.args[0]).to.deep.equal({
      dir: process.cwd(),
      enableLogging: true,
      interactive: true,
      args: ['-a', 'foo', '-l'],
      runAsNode: false,
    });
  });

  it('should handle run-as-node', async () => {
    await runCommand(['--run-as-node']);
    expect(startStub.callCount).to.equal(1);
    expect(startStub.firstCall.args[0]).to.deep.equal({
      dir: process.cwd(),
      enableLogging: false,
      interactive: true,
      runAsNode: true,
    });
  });

  it('should exit with the status code of the spawned Electron instance if it is not zero', async () => {
    childExitCode = 1;
    const originalExit = process.exit;
    process.exit = sinon.stub().returns(0);

    await runCommand();

    const getExitCode = new Promise((resolve) => {
      const check = () => (process.exit.firstCall ? resolve(process.exit.firstCall.args[0]) : setTimeout(check, 1));
      check();
    });

    await expect(getExitCode).to.eventually.equal(childExitCode);
    process.exit = originalExit;
  });
});

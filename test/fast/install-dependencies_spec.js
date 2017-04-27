import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('Install dependencies', () => {
  let install;
  let spawnSpy;
  let hasYarnSpy;
  let exitHandler;

  beforeEach(() => {
    const outOn = (s, fn) => fn('a');
    const errOn = outOn;
    spawnSpy = sinon.stub();
    spawnSpy.returns({
      stdout: { on: outOn },
      stderr: { on: errOn },
      on: (s, fn) => { exitHandler = fn; },
    });
    hasYarnSpy = sinon.stub();
    install = proxyquire.noCallThru().load('../../src/util/install-dependencies', {
      'yarn-or-npm': {
        spawn: spawnSpy,
        hasYarn: hasYarnSpy,
      },
    }).default;
  });

  it('should immediately resolve if no deps are provided', async () => {
    await install('mydir', []);
    expect(spawnSpy.callCount).to.equal(0);
  });

  it('should reject if reject the promise if exit code is not 0', (done) => {
    const p = install('void', ['electron']);
    p.then(() => done(new Error('expected install to be rejected')))
      .catch(() => done());
    exitHandler(1);
  });

  it('should resolve if reject the promise if exit code is 0', (done) => {
    const p = install('void', ['electron']);
    p.then(() => done())
      .catch(() => done(new Error('expected install to be resolved')));
    exitHandler(0);
  });

  describe('with yarn', () => {
    beforeEach(() => {
      hasYarnSpy.returns(true);
    });

    it('should install prod deps', () => {
      install('mydir', ['react']);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['add', 'react']);
    });

    it('should install dev deps', () => {
      install('mydir', ['eslint'], true);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['add', 'eslint', '--dev']);
    });

    it('should install exact deps', () => {
      install('mydir', ['react-dom'], false, true);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['add', 'react-dom', '--exact']);
    });

    it('should install exact dev deps', () => {
      install('mydir', ['mocha'], true, true);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['add', 'mocha', '--dev', '--exact']);
    });
  });

  describe('with npm', () => {
    beforeEach(() => {
      hasYarnSpy.returns(false);
    });

    it('should install prod deps', () => {
      install('mydir', ['react']);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['install', 'react', '--save']);
    });

    it('should install dev deps', () => {
      install('mydir', ['eslint'], true);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['install', 'eslint', '--save-dev']);
    });

    it('should install exact deps', () => {
      install('mydir', ['react-dom'], false, true);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['install', 'react-dom', '--save-exact', '--save']);
    });

    it('should install exact dev deps', () => {
      install('mydir', ['mocha'], true, true);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['install', 'mocha', '--save-exact', '--save-dev']);
    });
  });
});

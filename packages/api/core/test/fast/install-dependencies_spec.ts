import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { SinonStub, stub } from 'sinon';

import installDependencies, { DepType, DepVersionRestriction } from '../../src/util/install-dependencies';

describe('Install dependencies', () => {
  let install: typeof installDependencies;
  let spawnSpy: SinonStub;
  let hasYarnSpy: SinonStub;
  let spawnPromise: Promise<void>;
  let spawnPromiseResolve: () => void;
  let spawnPromiseReject: () => void;

  beforeEach(() => {
    spawnSpy = stub();
    spawnPromise = new Promise((resolve, reject) => {
      spawnPromiseResolve = resolve;
      spawnPromiseReject = reject;
    });
    spawnSpy.returns(spawnPromise);
    hasYarnSpy = stub();
    install = proxyquire.noCallThru().load('../../src/util/install-dependencies', {
      '@electron-forge/core-utils': {
        yarnOrNpmSpawn: spawnSpy,
        hasYarn: hasYarnSpy,
      },
    }).default;
  });

  it('should immediately resolve if no deps are provided', async () => {
    await install('mydir', []);
    expect(spawnSpy.callCount).to.equal(0);
  });

  it('should reject if reject the promise if exit code is not 0', async () => {
    const expectPromise = expect(install('void', ['electron'])).to.eventually.be.rejected;
    spawnPromiseReject();
    await expectPromise;
  });

  it('should resolve if reject the promise if exit code is 0', async () => {
    const expectPromise = expect(install('void', ['electron'])).to.eventually.be.fulfilled;
    spawnPromiseResolve();
    await expectPromise;
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
      install('mydir', ['eslint'], DepType.DEV);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['add', 'eslint', '--dev']);
    });

    it('should install exact deps', () => {
      install('mydir', ['react-dom'], DepType.PROD, DepVersionRestriction.EXACT);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['add', 'react-dom', '--exact']);
    });

    it('should install exact dev deps', () => {
      install('mydir', ['mocha'], DepType.DEV, DepVersionRestriction.EXACT);
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
      install('mydir', ['eslint'], DepType.DEV);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['install', 'eslint', '--save-dev']);
    });

    it('should install exact deps', () => {
      install('mydir', ['react-dom'], DepType.PROD, DepVersionRestriction.EXACT);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['install', 'react-dom', '--save-exact', '--save']);
    });

    it('should install exact dev deps', () => {
      install('mydir', ['mocha'], DepType.DEV, DepVersionRestriction.EXACT);
      expect(spawnSpy.firstCall.args[0]).to.be.deep.equal(['install', 'mocha', '--save-exact', '--save-dev']);
    });
  });
});

import { expect } from 'chai';
import systemYarnOrNpm from 'yarn-or-npm';

import { getPackageManager } from '../src/package-manager';

describe('yarn-or-npm', () => {
  let nodeInstaller: string | undefined;

  beforeEach(() => {
    nodeInstaller = process.env.NODE_INSTALLER;
    delete process.env.NODE_INSTALLER;
  });

  afterEach(() => {
    if (!nodeInstaller) {
      delete process.env.NODE_INSTALLER;
    } else {
      process.env.NODE_INSTALLER = nodeInstaller;
    }
  });

  it('should by default equal the system yarn-or-npm value', () => {
    expect(getPackageManager()).to.be.equal(systemYarnOrNpm());
  });

  it('should return yarn if NODE_INSTALLER=yarn', () => {
    process.env.NODE_INSTALLER = 'yarn';
    expect(getPackageManager()).to.be.equal('yarn');
  });

  it('should return npm if NODE_INSTALLER=npm', () => {
    process.env.NODE_INSTALLER = 'npm';
    expect(getPackageManager()).to.be.equal('npm');
  });

  it('should return yarn if NODE_INSTALLER=pnpm', () => {
    process.env.NODE_INSTALLER = 'pnpm';
    expect(getPackageManager()).to.be.equal('pnpm');
  });

  it('should return system value if NODE_INSTALLER is an unrecognized installer', () => {
    process.env.NODE_INSTALLER = 'magical_unicorn';
    expect(getPackageManager()).to.be.equal(systemYarnOrNpm());
  });
});

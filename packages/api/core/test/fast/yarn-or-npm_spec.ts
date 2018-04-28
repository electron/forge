import { expect } from 'chai';

import systemYarnOrNpm from 'yarn-or-npm';
import yarnOrNpm from '../../src/util/yarn-or-npm';

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
    expect(yarnOrNpm()).to.be.equal(systemYarnOrNpm());
  });

  it('should return yarn if NODE_INSTALLER=yarn', () => {
    process.env.NODE_INSTALLER = 'yarn';
    expect(yarnOrNpm()).to.be.equal('yarn');
  });

  it('should return npm if NODE_INSTALLER=npm', () => {
    process.env.NODE_INSTALLER = 'npm';
    expect(yarnOrNpm()).to.be.equal('npm');
  });

  it('should return system value if NODE_INSTALLER is an unrecognized installer', () => {
    process.env.NODE_INSTALLER = 'magical_unicorn';
    expect(yarnOrNpm()).to.be.equal(systemYarnOrNpm());
  });
});

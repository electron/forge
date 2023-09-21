import { expect } from 'chai';
import systemYarnOrNpm from 'yarn-or-npm';

import { getPackageManager } from '../src/package-manager';

describe('checkPackageManager', () => {
  let userAgent: string | undefined;
  let nodeInstaller: string | undefined;

  beforeEach(() => {
    userAgent = process.env.npm_config_user_agent;
    nodeInstaller = process.env.NODE_INSTALLER;
    delete process.env.npm_config_user_agent;
    delete process.env.NODE_INSTALLER;
  });

  afterEach(() => {
    if (!userAgent) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = userAgent;
    }

    if (!nodeInstaller) {
      delete process.env.NODE_INSTALLER;
    } else {
      process.env.NODE_INSTALLER = nodeInstaller;
    }
  });

  it('should by default equal the system yarn-or-npm value', () => {
    expect(getPackageManager()).to.be.equal(systemYarnOrNpm());
  });

  it('should return yarn if npm_config_user_agent set to yarn', () => {
    process.env.npm_config_user_agent = 'yarn/1.22.19 npm/? node/v18.17.1 darwin arm64';
    expect(getPackageManager()).to.be.equal('yarn');
  });

  it('should return npm if npm_config_user_agent set to npm', () => {
    process.env.npm_config_user_agent = 'npm/9.6.7 node/v18.17.1 darwin arm64 workspaces/false';
    expect(getPackageManager()).to.be.equal('npm');
  });

  it('should return yarn if npm_config_user_agent set to pnpm', () => {
    process.env.npm_config_user_agent = 'pnpm/8.7.5 npm/? node/v18.17.1 darwin arm64';
    expect(getPackageManager()).to.be.equal('pnpm');
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

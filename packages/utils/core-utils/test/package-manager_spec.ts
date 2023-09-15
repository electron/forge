import { expect } from 'chai';

import { getPackageManager } from '../src/package-manager';

describe('get-package-manager', () => {
  let userAgent: string | undefined;

  beforeEach(() => {
    userAgent = process.env.npm_config_user_agent;
    delete process.env.npm_config_user_agent;
  });

  afterEach(() => {
    if (!userAgent) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = userAgent;
    }
  });

  it('should return npm if npm_config_user_agent=npm', () => {
    process.env.npm_config_user_agent = 'npm';
    expect(getPackageManager()).to.be.equal('npm');
  });

  it('should return yarn if npm_config_user_agent=yarn', () => {
    process.env.npm_config_user_agent = 'yarn';
    expect(getPackageManager()).to.be.equal('yarn');
  });

  it('should return pnpm if npm_config_user_agent=pnpm', () => {
    process.env.npm_config_user_agent = 'pnpm';
    expect(getPackageManager()).to.be.equal('pnpm');
  });
});

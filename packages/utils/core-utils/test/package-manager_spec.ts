import { expect } from 'chai';

import { getPackageManager, isNpm, isPnpm, isYarn } from '../src/package-manager';

describe('checkPackageManager', () => {
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

  it('should return npm if NODE_INSTALLER=npm', async () => {
    process.env.NODE_INSTALLER = 'npm';
    const pm = await getPackageManager();
    expect(pm).to.be.equal('npm');
  });

  it('should return yarn if NODE_INSTALLER=yarn', async () => {
    process.env.NODE_INSTALLER = 'yarn';
    const pm = await getPackageManager();
    expect(pm).to.be.equal('yarn');
  });

  it('should return yarn if NODE_INSTALLER=pnpm', async () => {
    process.env.NODE_INSTALLER = 'pnpm';
    const pm = await getPackageManager();
    expect(pm).to.be.equal('pnpm');
  });

  it('function `isNpm` should return true if NODE_INSTALLER=npm', async () => {
    process.env.NODE_INSTALLER = 'npm';
    const res = await isNpm();
    expect(res).to.be.equal(true);
  });

  it('function `isYarn` should return true if NODE_INSTALLER=yarn', async () => {
    process.env.NODE_INSTALLER = 'yarn';
    const res = await isYarn();
    expect(res).to.be.equal(true);
  });

  it('function `isPnpm` should return true if NODE_INSTALLER=pnpm', async () => {
    process.env.NODE_INSTALLER = 'pnpm';
    const res = await isPnpm();
    expect(res).to.be.equal(true);
  });
});

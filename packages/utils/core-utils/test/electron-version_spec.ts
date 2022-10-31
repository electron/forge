import os from 'os';
import path from 'path';

import { expect } from 'chai';
import fs from 'fs-extra';

import { devDeps, exactDevDeps } from '../../../api/core/src/api/init-scripts/init-npm';
import { getElectronModulePath, getElectronVersion, updateElectronDependency } from '../src/electron-version';

const fixturePath = path.resolve(__dirname, '..', '..', '..', 'api', 'core', 'test', 'fixture');

describe('updateElectronDependency', () => {
  it('adds an Electron dep if one does not already exist', () => {
    const packageJSON = { dependencies: {}, devDependencies: {} };
    const [dev, exact] = updateElectronDependency(packageJSON, devDeps, exactDevDeps);
    expect(dev).to.deep.equal(devDeps);
    expect(exact).to.deep.equal(exactDevDeps);
  });

  it('does not add an Electron dep if one already exists', () => {
    const packageJSON = {
      dependencies: {},
      devDependencies: { electron: '0.37.0' },
    };
    const [dev, exact] = updateElectronDependency(packageJSON, devDeps, exactDevDeps);
    expect(dev).to.deep.equal(devDeps);
    expect(exact).to.deep.equal([]);
  });

  it('moves an Electron dependency from dependencies to devDependencies', () => {
    const packageJSON = {
      dependencies: { electron: '0.37.0' },
      devDependencies: {},
    };
    const [dev, exact] = updateElectronDependency(packageJSON, devDeps, exactDevDeps);
    expect(dev.includes('electron@0.37.0')).to.equal(true);
    expect(exact).to.deep.equal([]);
  });
});

describe('getElectronVersion', () => {
  it('fails without devDependencies', () => expect(getElectronVersion('', {})).to.eventually.be.rejectedWith('does not have any devDependencies'));

  it('fails without electron devDependencies', () =>
    expect(getElectronVersion('', { devDependencies: {} })).to.eventually.be.rejectedWith('Electron packages in devDependencies'));

  it('fails with a non-exact version and no electron installed', () => {
    const fixtureDir = path.resolve(fixturePath, 'dummy_app');
    return expect(getElectronVersion(fixtureDir, { devDependencies: { electron: '^4.0.2' } })).to.eventually.be.rejectedWith('Cannot find the package');
  });

  it('works with a non-exact version with electron installed', () => {
    const fixtureDir = path.resolve(fixturePath, 'non-exact');
    return expect(getElectronVersion(fixtureDir, { devDependencies: { electron: '^4.0.2' } })).to.eventually.equal('4.0.9');
  });

  it('works with electron-prebuilt-compile', () => {
    const packageJSON = {
      devDependencies: { 'electron-prebuilt-compile': '1.0.0' },
    };
    return expect(getElectronVersion('', packageJSON)).to.eventually.equal('1.0.0');
  });

  it('works with electron-prebuilt', async () => {
    const packageJSON = {
      devDependencies: { 'electron-prebuilt': '1.0.0' },
    };
    return expect(await getElectronVersion('', packageJSON)).to.be.equal('1.0.0');
  });

  it('works with electron-nightly', async () => {
    const packageJSON = {
      devDependencies: { 'electron-nightly': '5.0.0-nightly.20190107' },
    };
    return expect(await getElectronVersion('', packageJSON)).to.be.equal('5.0.0-nightly.20190107');
  });

  it('works with electron', async () => {
    const packageJSON = {
      devDependencies: { electron: '1.0.0' },
    };
    return expect(await getElectronVersion('', packageJSON)).to.be.equal('1.0.0');
  });

  describe('with yarn workspaces', () => {
    before(() => {
      process.env.NODE_INSTALLER = 'yarn';
    });

    it('works with a non-exact version', async () => {
      const fixtureDir = path.resolve(fixturePath, 'yarn-workspace', 'packages', 'subpackage');
      const packageJSON = {
        devDependencies: { electron: '^4.0.4' },
      };

      expect(await getElectronVersion(fixtureDir, packageJSON)).to.be.equal('4.0.9');
    });

    after(() => {
      delete process.env.NODE_INSTALLER;
    });
  });
});

describe('getElectronModulePath', () => {
  it('fails without devDependencies', () => expect(getElectronModulePath('', {})).to.eventually.be.rejectedWith('does not have any devDependencies'));

  it('fails without electron devDependencies', () =>
    expect(getElectronModulePath('', { devDependencies: {} })).to.eventually.be.rejectedWith('Electron packages in devDependencies'));

  describe('with no electron installed', () => {
    let tempDir: string;
    before(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'electron-forge-test-'));
    });

    it('throws an error saying it cannot find electron', async () => {
      const fixtureDir = path.resolve(fixturePath, 'dummy_app');
      await fs.copy(fixtureDir, tempDir);
      return expect(getElectronModulePath(tempDir, { devDependencies: { electron: '^4.0.2' } })).to.eventually.be.rejectedWith('Cannot find the package');
    });

    after(async () => {
      await fs.remove(tempDir);
    });
  });

  it('works with electron', () => {
    const fixtureDir = path.resolve(fixturePath, 'non-exact');
    return expect(getElectronModulePath(fixtureDir, { devDependencies: { electron: '^4.0.2' } })).to.eventually.equal(
      path.join(fixtureDir, 'node_modules', 'electron')
    );
  });

  describe('with npm workspaces', () => {
    before(() => {
      process.env.NODE_INSTALLER = 'npm';
    });

    it('finds the top-level electron module', async () => {
      const workspaceDir = path.resolve(fixturePath, 'npm-workspace');
      const fixtureDir = path.join(workspaceDir, 'packages', 'subpackage');
      const packageJSON = {
        devDependencies: { electron: '^4.0.4' },
      };

      expect(await getElectronModulePath(fixtureDir, packageJSON)).to.be.equal(path.join(workspaceDir, 'node_modules', 'electron'));
    });

    after(() => {
      delete process.env.NODE_INSTALLER;
    });
  });

  describe('with yarn workspaces', () => {
    before(() => {
      process.env.NODE_INSTALLER = 'yarn';
    });

    it('finds the top-level electron module', async () => {
      const workspaceDir = path.resolve(fixturePath, 'yarn-workspace');
      const fixtureDir = path.join(workspaceDir, 'packages', 'subpackage');
      const packageJSON = {
        devDependencies: { electron: '^4.0.4' },
      };

      expect(await getElectronModulePath(fixtureDir, packageJSON)).to.be.equal(path.join(workspaceDir, 'node_modules', 'electron'));
    });

    it('finds the top-level electron module despite the additional node_modules folder inside the package', async () => {
      const workspaceDir = path.resolve(fixturePath, 'yarn-workspace');
      const fixtureDir = path.join(workspaceDir, 'packages', 'with-node-modules');
      const packageJSON = {
        devDependencies: { electron: '^4.0.4' },
      };

      expect(await getElectronModulePath(fixtureDir, packageJSON)).to.be.equal(path.join(workspaceDir, 'node_modules', 'electron'));
    });

    it('finds the correct electron module in nohoist mode', async () => {
      const workspaceDir = path.resolve(fixturePath, 'yarn-workspace');
      const fixtureDir = path.join(workspaceDir, 'packages', 'electron-folder-in-node-modules');
      const packageJSON = {
        devDependencies: { electron: '^13.0.0' },
      };

      expect(await getElectronModulePath(fixtureDir, packageJSON)).to.be.equal(path.join(fixtureDir, 'node_modules', 'electron'));
      expect(await getElectronModulePath(fixtureDir, packageJSON)).not.to.be.equal(path.join(workspaceDir, 'node_modules', 'electron'));
    });

    after(() => {
      delete process.env.NODE_INSTALLER;
    });
  });
});

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { devDeps, exactDevDeps } from '../../../api/core/src/api/init-scripts/init-npm';
import { getElectronModulePath, getElectronVersion, updateElectronDependency } from '../src/electron-version';

const fixturePath = path.resolve(__dirname, '..', '..', '..', 'api', 'core', 'spec', 'fixture');

describe('updateElectronDependency', () => {
  it('adds an Electron dep if one does not already exist', () => {
    const packageJSON = { dependencies: {}, devDependencies: {} };
    const [dev, exact] = updateElectronDependency(packageJSON, devDeps, exactDevDeps);
    expect(dev).toEqual(devDeps);
    expect(exact).toEqual(exactDevDeps);
  });

  it('does not add an Electron dep if one already exists', () => {
    const packageJSON = {
      dependencies: {},
      devDependencies: { electron: '0.37.0' },
    };
    const [dev, exact] = updateElectronDependency(packageJSON, devDeps, exactDevDeps);
    expect(dev).toEqual(devDeps);
    expect(exact).toEqual([]);
  });

  it('moves an Electron dependency from dependencies to devDependencies', () => {
    const packageJSON = {
      dependencies: { electron: '0.37.0' },
      devDependencies: {},
    };
    const [dev, exact] = updateElectronDependency(packageJSON, devDeps, exactDevDeps);
    expect(dev.includes('electron@0.37.0')).toEqual(true);
    expect(exact).toEqual([]);
  });
});

describe('getElectronVersion', () => {
  it('fails without devDependencies', async () => {
    await expect(getElectronVersion('', {})).rejects.toThrow('does not have any devDependencies');
  });

  it('fails without electron devDependencies', async () =>
    expect(getElectronVersion('', { devDependencies: {} })).rejects.toThrow('Electron packages in devDependencies'));

  it('fails with a non-exact version and no electron installed', async () => {
    const fixtureDir = path.resolve(fixturePath, 'dummy_app');
    await expect(getElectronVersion(fixtureDir, { devDependencies: { electron: '^4.0.2' } })).rejects.toThrow('Cannot find the package');
  });

  it('works with a non-exact version with electron installed', async () => {
    const fixtureDir = path.resolve(fixturePath, 'non-exact');
    await expect(getElectronVersion(fixtureDir, { devDependencies: { electron: '^4.0.2' } })).resolves.toEqual('4.0.9');
  });

  it('works with electron-nightly', async () => {
    const packageJSON = {
      devDependencies: { 'electron-nightly': '5.0.0-nightly.20190107' },
    };
    await expect(getElectronVersion('', packageJSON)).resolves.toEqual('5.0.0-nightly.20190107');
  });

  it('works with electron', async () => {
    const packageJSON = {
      devDependencies: { electron: '1.0.0' },
    };
    await expect(getElectronVersion('', packageJSON)).resolves.toEqual('1.0.0');
  });

  describe('with yarn workspaces', () => {
    beforeAll(() => {
      process.env.NODE_INSTALLER = 'yarn';
    });

    it('works with a non-exact version', async () => {
      const fixtureDir = path.resolve(fixturePath, 'yarn-workspace', 'packages', 'subpackage');
      const packageJSON = {
        devDependencies: { electron: '^4.0.4' },
      };

      await expect(getElectronVersion(fixtureDir, packageJSON)).resolves.toEqual('4.0.9');
    });

    afterAll(() => {
      delete process.env.NODE_INSTALLER;
    });
  });
});

describe('getElectronModulePath', () => {
  it('fails without devDependencies', async () => {
    await expect(getElectronModulePath('', {})).rejects.toThrow('does not have any devDependencies');
  });

  it('fails without electron devDependencies', async () => {
    await expect(getElectronModulePath('', { devDependencies: {} })).rejects.toThrow('Electron packages in devDependencies');
  });

  describe('with no electron installed', () => {
    let tempDir: string;
    beforeAll(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'electron-forge-test-'));
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true });
    });

    it('throws an error saying it cannot find electron', async () => {
      const fixtureDir = path.resolve(fixturePath, 'dummy_app');
      await fs.cp(fixtureDir, tempDir, { recursive: true });
      await expect(getElectronModulePath(tempDir, { devDependencies: { electron: '^4.0.2' } })).rejects.toThrow('Cannot find the package');
    });
  });

  it('works with electron', async () => {
    const fixtureDir = path.resolve(fixturePath, 'non-exact');
    await expect(getElectronModulePath(fixtureDir, { devDependencies: { electron: '^4.0.2' } })).resolves.toEqual(
      path.join(fixtureDir, 'node_modules', 'electron')
    );
  });

  describe('with npm workspaces', () => {
    beforeAll(() => {
      process.env.NODE_INSTALLER = 'npm';
    });

    afterAll(() => {
      delete process.env.NODE_INSTALLER;
    });

    it('finds the top-level electron module', async () => {
      const workspaceDir = path.resolve(fixturePath, 'npm-workspace');
      const fixtureDir = path.join(workspaceDir, 'packages', 'subpackage');
      const packageJSON = {
        devDependencies: { electron: '^4.0.4' },
      };

      await expect(getElectronModulePath(fixtureDir, packageJSON)).resolves.toEqual(path.join(workspaceDir, 'node_modules', 'electron'));
    });
  });

  describe('with yarn workspaces', () => {
    beforeAll(() => {
      process.env.NODE_INSTALLER = 'yarn';
    });

    afterAll(() => {
      delete process.env.NODE_INSTALLER;
    });

    it('finds the top-level electron module', async () => {
      const workspaceDir = path.resolve(fixturePath, 'yarn-workspace');
      const fixtureDir = path.join(workspaceDir, 'packages', 'subpackage');
      const packageJSON = {
        devDependencies: { electron: '^4.0.4' },
      };

      await expect(getElectronModulePath(fixtureDir, packageJSON)).resolves.toEqual(path.join(workspaceDir, 'node_modules', 'electron'));
    });

    it('finds the top-level electron module despite the additional node_modules folder inside the package', async () => {
      const workspaceDir = path.resolve(fixturePath, 'yarn-workspace');
      const fixtureDir = path.join(workspaceDir, 'packages', 'with-node-modules');
      const packageJSON = {
        devDependencies: { electron: '^4.0.4' },
      };

      await expect(getElectronModulePath(fixtureDir, packageJSON)).resolves.toEqual(path.join(workspaceDir, 'node_modules', 'electron'));
    });

    it('finds the correct electron module in nohoist mode', async () => {
      const workspaceDir = path.resolve(fixturePath, 'yarn-workspace');
      const fixtureDir = path.join(workspaceDir, 'packages', 'electron-folder-in-node-modules');
      const packageJSON = {
        devDependencies: { electron: '^13.0.0' },
      };

      await expect(getElectronModulePath(fixtureDir, packageJSON)).resolves.toEqual(path.join(fixtureDir, 'node_modules', 'electron'));
      await expect(getElectronModulePath(fixtureDir, packageJSON)).resolves.not.toEqual(path.join(workspaceDir, 'node_modules', 'electron'));
    });
  });
});

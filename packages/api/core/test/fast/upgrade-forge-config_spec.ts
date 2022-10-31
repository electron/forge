import assert from 'assert';

import { ForgeConfig, IForgeResolvableMaker, IForgeResolvablePublisher } from '@electron-forge/shared-types';
import { expect } from 'chai';
import { merge } from 'lodash';

import upgradeForgeConfig, { updateUpgradedForgeDevDeps } from '../../src/util/upgrade-forge-config';

describe('upgradeForgeConfig', () => {
  it('converts Electron Packager config', () => {
    const oldConfig = {
      electronPackagerConfig: {
        asar: true,
        packageManager: 'npm',
      },
    };
    const expected = { asar: true };

    const newConfig = upgradeForgeConfig(oldConfig);
    expect(newConfig.packagerConfig).to.deep.equal(expected);
  });

  it('converts @electron/rebuild config', () => {
    const rebuildConfig = { types: ['prod'] };
    const oldConfig = { electronRebuildConfig: { ...rebuildConfig } };

    const newConfig = upgradeForgeConfig(oldConfig);
    expect(newConfig.rebuildConfig).to.deep.equal(rebuildConfig);
  });

  it('converts maker config', () => {
    const oldConfig = {
      make_targets: {
        linux: ['deb'],
      },
      electronInstallerDebian: {
        depends: ['liboath0'],
      },
    };
    const expected = [
      {
        name: '@electron-forge/maker-deb',
        config: {
          depends: ['liboath0'],
        },
        platforms: ['linux'],
      },
    ] as IForgeResolvableMaker[];

    const newConfig = upgradeForgeConfig(oldConfig);
    expect(newConfig.makers).to.deep.equal(expected);
  });

  it('adds the zip maker when specified in make_targets', () => {
    const oldConfig = {
      make_targets: {
        darwin: ['zip'],
        linux: ['zip'],
      },
    };
    const expected = [
      {
        name: '@electron-forge/maker-zip',
        platforms: ['darwin', 'linux'],
      },
    ] as IForgeResolvableMaker[];

    const newConfig = upgradeForgeConfig(oldConfig);
    expect(newConfig.makers).to.deep.equal(expected);
  });

  it('converts publisher config', () => {
    const oldConfig = {
      snapStore: {
        release: 'beta',
      },
    };
    const expected = [
      {
        name: '@electron-forge/publisher-snapcraft',
        config: {
          release: 'beta',
        },
        platforms: null,
      },
    ] as IForgeResolvablePublisher[];

    const newConfig = upgradeForgeConfig(oldConfig);
    expect(newConfig.publishers).to.deep.equal(expected);
  });

  it('converts GitHub publisher config', () => {
    const octokitOptions = {
      timeout: 0,
    };
    const repo = {
      name: 'myapp',
      owner: 'user',
    };
    const oldConfig = {
      github_repository: {
        options: octokitOptions,
        draft: true,
        ...repo,
      },
    };
    const newConfig = upgradeForgeConfig(oldConfig);
    expect(newConfig.publishers).to.have.lengthOf(1);
    assert(newConfig.publishers);
    const publisherConfig = (newConfig.publishers[0] as IForgeResolvablePublisher).config;
    expect(publisherConfig.repository).to.deep.equal(repo);
    expect(publisherConfig.octokitOptions).to.deep.equal(octokitOptions);
    expect(publisherConfig.draft).to.equal(true);
  });
});

describe('updateUpgradedForgeDevDeps', () => {
  const skeletonPackageJSON = {
    config: {
      forge: {
        packagerConfig: {},
        rebuildConfig: {},
        makers: [],
        publishers: [],
        plugins: [],
        pluginInterface: {
          overrideStartLogic: () => Promise.resolve(false),
          triggerHook: () => Promise.resolve(),
          triggerMutatingHook: () => Promise.resolve(),
        },
      } as ForgeConfig,
    },
    devDependencies: {},
  };

  it('removes unused makers from devDependencies', () => {
    const packageJSON = merge({}, skeletonPackageJSON);
    const devDeps = updateUpgradedForgeDevDeps(packageJSON, ['@electron-forge/maker-squirrel']);
    expect(devDeps).to.deep.equal([]);
  });

  it('adds makers to devDependencies', () => {
    const packageJSON = merge({}, skeletonPackageJSON);
    packageJSON.config.forge.makers = [
      {
        name: '@electron-forge/maker-zip',
        platforms: ['darwin', 'linux'],
      },
      {
        name: '@electron-forge/maker-squirrel',
        config: {},
        platforms: ['win32'],
      },
    ] as IForgeResolvableMaker[];

    const actual = updateUpgradedForgeDevDeps(packageJSON, []);
    expect(actual).to.have.lengthOf(2);
    expect(actual.find((dep) => dep.startsWith('@electron-forge/maker-zip'))).to.not.equal(undefined);
    expect(actual.find((dep) => dep.startsWith('@electron-forge/maker-squirrel'))).to.not.equal(undefined);
  });

  it('adds publishers to devDependencies', () => {
    const packageJSON = merge({}, skeletonPackageJSON);
    packageJSON.config.forge.publishers = [{ name: '@electron-forge/publisher-github' }, { name: '@electron-forge/publisher-snapcraft' }];

    const actual = updateUpgradedForgeDevDeps(packageJSON, []);
    expect(actual).to.have.lengthOf(2);
    expect(actual.find((dep) => dep.startsWith('@electron-forge/publisher-github'))).to.not.equal(undefined);
    expect(actual.find((dep) => dep.startsWith('@electron-forge/publisher-snapcraft'))).to.not.equal(undefined);
  });

  it('adds electron-compile plugin to devDependencies when electron-prebuilt-compile is in devDependencies', () => {
    const packageJSON = merge({}, skeletonPackageJSON, {
      devDependencies: {
        'electron-prebuilt-compile': '2.0.0',
      },
    });

    const actual = updateUpgradedForgeDevDeps(packageJSON, []);
    expect(actual, JSON.stringify(actual)).to.have.lengthOf(1);
    expect(actual[0]).to.match(/^@electron-forge\/plugin-compile/);
  });
});

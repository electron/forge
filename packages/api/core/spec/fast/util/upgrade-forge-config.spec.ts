import assert from 'node:assert';

import { ForgeConfig, IForgeResolvableMaker, IForgeResolvablePublisher } from '@electron-forge/shared-types';
import { merge } from 'lodash';
import { describe, expect, it } from 'vitest';

import upgradeForgeConfig, { updateUpgradedForgeDevDeps } from '../../../src/util/upgrade-forge-config';

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
    expect(newConfig.packagerConfig).toEqual(expected);
  });

  it('converts @electron/rebuild config', () => {
    const rebuildConfig = { types: ['prod'] };
    const oldConfig = { electronRebuildConfig: { ...rebuildConfig } };

    const newConfig = upgradeForgeConfig(oldConfig);
    expect(newConfig.rebuildConfig).toEqual(rebuildConfig);
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
    expect(newConfig.makers).toEqual(expected);
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
    expect(newConfig.makers).toEqual(expected);
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
    expect(newConfig.publishers).toEqual(expected);
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
    expect(newConfig.publishers).toHaveLength(1);
    assert(newConfig.publishers);
    const publisherConfig = (newConfig.publishers[0] as IForgeResolvablePublisher).config;
    expect(publisherConfig.repository).toEqual(repo);
    expect(publisherConfig.octokitOptions).toEqual(octokitOptions);
    expect(publisherConfig.draft).toEqual(true);
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
    expect(devDeps).toEqual([]);
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
    expect(actual).toHaveLength(2);
    expect(actual.find((dep) => dep.startsWith('@electron-forge/maker-zip'))).not.toEqual(undefined);
    expect(actual.find((dep) => dep.startsWith('@electron-forge/maker-squirrel'))).not.toEqual(undefined);
  });

  it('adds publishers to devDependencies', () => {
    const packageJSON = merge({}, skeletonPackageJSON);
    packageJSON.config.forge.publishers = [{ name: '@electron-forge/publisher-github' }, { name: '@electron-forge/publisher-snapcraft' }];

    const actual = updateUpgradedForgeDevDeps(packageJSON, []);
    expect(actual).toHaveLength(2);
    expect(actual.find((dep) => dep.startsWith('@electron-forge/publisher-github'))).not.toEqual(undefined);
    expect(actual.find((dep) => dep.startsWith('@electron-forge/publisher-snapcraft'))).not.toEqual(undefined);
  });
});

import { getElectronVersion, hasYarn, yarnOrNpmSpawn } from '@electron-forge/core-utils';

import { BuildIdentifierConfig, BuildIdentifierMap, fromBuildIdentifier } from './forge-config';

export default class ForgeUtils {
  /**
   * Helper for creating a dynamic config value that will get its real value
   * based on the "buildIdentifier" in your Forge config.
   *
   * Usage:
   * `fromBuildIdentifier({ stable: 'App', beta: 'App Beta' })`
   */
  fromBuildIdentifier<T>(map: BuildIdentifierMap<T>): BuildIdentifierConfig<T> {
    return fromBuildIdentifier(map);
  }

  getElectronVersion = getElectronVersion;

  hasYarn = hasYarn;

  yarnOrNpmSpawn = yarnOrNpmSpawn;
}

import { getElectronVersion, spawnPackageManager } from '@electron-forge/core-utils';

import {
  BuildIdentifierConfig,
  BuildIdentifierMap,
  fromBuildIdentifier,
  registerForgeConfigForDirectory,
  unregisterForgeConfigForDirectory,
} from './forge-config';

import type { ForgeConfig } from '@electron-forge/shared-types';

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

  spawnPackageManager = spawnPackageManager;

  /**
   * Register a virtual config file for forge to find.
   * Takes precedence over other configuration options like a forge.config.js file.
   * Dir should point to the folder containing the app.
   */
  registerForgeConfigForDirectory(dir: string, config: ForgeConfig): void {
    return registerForgeConfigForDirectory(dir, config);
  }

  /**
   * Unregister a forge config previously registered with registerForgeConfigForDirectory.
   */
  unregisterForgeConfigForDirectory(dir: string): void {
    return unregisterForgeConfigForDirectory(dir);
  }
}

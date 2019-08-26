import { fromBuildIdentifier } from './forge-config';
import { hasYarn, yarnOrNpmSpawn } from './yarn-or-npm';

export default class ForgeUtils {
  /**
   * Helper for creating a dynamic config value that will get it's real value
   * based on the "buildIdentifier" in your forge config.
   *
   * Usage:
   * `fromBuildIdentifier({ stable: 'App', beta: 'App Beta' })`
   */
  fromBuildIdentifier<T>(map: { [key: string]: T | undefined }) {
    return fromBuildIdentifier(map);
  }

  hasYarn = hasYarn;

  yarnOrNpmSpawn = yarnOrNpmSpawn;
}

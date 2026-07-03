import {
  ElectronProcess,
  ForgeMakeResult,
  ForgePackageResult,
} from '@electron-forge/shared-types';

import ForgeUtils from '../util/index.js';
import { defaultSanitizePackageJson } from '../util/sanitize-package-json.js';

import make, { MakeOptions } from './make.js';
import _package, { PackageOptions } from './package.js';
import release, { ReleaseOptions } from './release.js';
import start, { StartOptions } from './start.js';

/**
 * @deprecated Use {@link ReleaseOptions} instead. `PublishOptions` is a
 * deprecated alias that will be removed in a future major version.
 */
export type PublishOptions = ReleaseOptions;

export class ForgeAPI {
  /**
   * Make distributables for an Electron application
   */
  make(opts: MakeOptions): Promise<ForgeMakeResult[]> {
    return make(opts);
  }

  /**
   * Package an Electron application
   */
  package(opts: PackageOptions): Promise<ForgePackageResult[]> {
    return _package(opts);
  }

  /**
   * Release an Electron application into the given target service
   */
  release(opts: ReleaseOptions): Promise<void> {
    return release(opts);
  }

  /**
   * Publish an Electron application into the given target service
   *
   * @deprecated Use {@link ForgeAPI.release} instead. `publish` is a deprecated
   * alias that will be removed in a future major version.
   */
  publish(opts: ReleaseOptions): Promise<void> {
    return release(opts);
  }

  /**
   * Start an Electron application.
   *
   * Handles things like native module rebuilding for you on the fly
   */
  start(opts: StartOptions): Promise<ElectronProcess> {
    return start(opts);
  }
}

const api = new ForgeAPI();
const utils = new ForgeUtils();

export {
  ForgeMakeResult,
  ForgePackageResult,
  ElectronProcess,
  ForgeUtils,
  MakeOptions,
  PackageOptions,
  ReleaseOptions,
  StartOptions,
  api,
  defaultSanitizePackageJson,
  utils,
};

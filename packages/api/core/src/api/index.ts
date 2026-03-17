import {
  ElectronProcess,
  ForgeMakeResult,
  ForgePackageResult,
} from '@electron-forge/shared-types';

import ForgeUtils from '../util/index.js';

import make, { MakeOptions } from './make.js';
import _package, { PackageOptions } from './package.js';
import publish, { PublishOptions } from './publish.js';
import start, { StartOptions } from './start.js';

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
   * Publish an Electron application into the given target service
   */
  publish(opts: PublishOptions): Promise<void> {
    return publish(opts);
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
  PublishOptions,
  StartOptions,
  api,
  utils,
};

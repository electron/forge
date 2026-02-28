import { ElectronProcess, ForgeMakeResult } from '@electron-forge/shared-types';

// eslint-disable-next-line n/no-missing-import
import ForgeUtils from '../util';

import make, { MakeOptions } from './make';
import _package, { PackageOptions } from './package';
import publish, { PublishOptions } from './publish';
import start, { StartOptions } from './start';

export class ForgeAPI {
  /**
   * Make distributables for an Electron application
   */
  make(opts: MakeOptions): Promise<ForgeMakeResult[]> {
    return make(opts);
  }

  /**
   * Resolves hooks if they are a path to a file (instead of a `Function`)
   */
  async package(opts: PackageOptions): Promise<void> {
    await _package(opts);
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
  ElectronProcess,
  ForgeUtils,
  MakeOptions,
  PackageOptions,
  PublishOptions,
  StartOptions,
  api,
  utils,
};

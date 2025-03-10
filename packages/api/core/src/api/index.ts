import { ElectronProcess, ForgeMakeResult } from '@electron-forge/shared-types';

// eslint-disable-next-line n/no-missing-import
import ForgeUtils from '../util';

import _import, { ImportOptions } from './import';
import init, { InitOptions } from './init';
import make, { MakeOptions } from './make';
import _package, { PackageOptions } from './package';
import publish, { PublishOptions } from './publish';
import start, { StartOptions } from './start';

export class ForgeAPI {
  /**
   * Attempt to import a given module directory to the Electron Forge standard.
   *
   * * Sets up `git` and the correct NPM dependencies
   * * Adds a template forge config to `package.json`
   */
  import(opts: ImportOptions): Promise<void> {
    return _import(opts);
  }

  /**
   * Initialize a new Electron Forge template project in the given directory.
   */
  init(opts: InitOptions): Promise<void> {
    return init(opts);
  }

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

export { ForgeMakeResult, ElectronProcess, ForgeUtils, ImportOptions, InitOptions, MakeOptions, PackageOptions, PublishOptions, StartOptions, api, utils };

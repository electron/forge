// eslint-disable-next-line import/no-extraneous-dependencies
import { ForgePlatform, ForgeConfig, ForgeMakeResult } from '@electron-forge/shared-types';

/* eslint-disable no-unused-vars */

export interface PublisherOptions {
  /**
   * The base directory of the apps source code
   */
  dir: string;
  /**
   * The results from running the make command
   */
  makeResults: ForgeMakeResult[];
  /**
   * The raw forgeConfig this app is using.
   *
   * You probably shouldn't use this
   */
  forgeConfig: ForgeConfig;
}

export default abstract class Publisher<C> {
  public abstract name: string;

  public defaultPlatforms?: ForgePlatform[];

  /* tslint:disable variable-name */
  __isElectronForgePublisher!: true;
  /* tslint:enable variable-name */

  constructor(public config: C, protected providedPlatforms?: ForgePlatform[]) {
    this.config = config;
    Object.defineProperty(this, '__isElectronForgePublisher', {
      value: true,
      enumerable: false,
      configurable: false,
    });
  }

  get platforms() {
    if (this.providedPlatforms) return this.providedPlatforms;
    if (this.defaultPlatforms) return this.defaultPlatforms;
    return ['win32', 'linux', 'darwin', 'mas'];
  }

  /**
   * Publishers must implement this method to publish the artifacts returned from
   * make calls.  If any errors occur you must throw them, failing silently or simply
   * logging will not propagate issues up to forge.
   *
   * Please note for a given version publish will be called multiple times, once
   * for each set of "platform" and "arch".  This means if you are publishing
   * darwin and win32 artifacts to somewhere like GitHub on the first publish call
   * you will have to create the version on GitHub and the second call will just
   * be appending files to the existing version.
   */
  async publish(opts: PublisherOptions) { // eslint-disable-line @typescript-eslint/no-unused-vars
    throw new Error(`Publisher ${this.name} did not implement the publish method`);
  }
}

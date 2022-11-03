import { ForgeListrTaskDefinition, ForgeMakeResult, ForgePlatform, IForgePublisher, ResolvedForgeConfig } from '@electron-forge/shared-types';

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
  forgeConfig: ResolvedForgeConfig;
  /**
   * A method that allows the publisher to provide status / progress updates
   * to the user. This method currently maps to setting the "output" line
   * in the publisher listr task.
   */
  setStatusLine: (statusLine: string) => void;
}

export default abstract class Publisher<C> implements IForgePublisher {
  public abstract name: string;

  public defaultPlatforms?: ForgePlatform[];

  /** @internal */
  __isElectronForgePublisher!: true;

  /**
   * @param config - A configuration object for this publisher
   * @param platformsToPublishOn - If you want this maker to run on platforms different from `defaultPlatforms` you can provide those platforms here
   */
  constructor(public config: C, protected platformsToPublishOn?: ForgePlatform[]) {
    this.config = config;
    Object.defineProperty(this, '__isElectronForgePublisher', {
      value: true,
      enumerable: false,
      configurable: false,
    });
  }

  get platforms(): ForgePlatform[] {
    if (this.platformsToPublishOn) return this.platformsToPublishOn;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async publish(opts: PublisherOptions): Promise<ForgeListrTaskDefinition[] | void> {
    throw new Error(`Publisher ${this.name} did not implement the publish method`);
  }
}

export { Publisher as PublisherBase };

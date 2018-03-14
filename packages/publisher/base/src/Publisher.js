/* eslint-disable no-unused-vars */

export default class Publisher {
  constructor(name) {
    this.name = name;
    Object.defineProperty(this, '__isElectronForgePublisher', {
      value: true,
      enumerable: false,
      configurable: false,
    });
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
  async publish({
    dir,            // The base directory of the apps source code
    makeResults,      // An array of MakeResult objects, see the MakeResult object definition for details
    packageJSON,    // The packageJSON of the app
    config,         // The config that is dedicated for this publisher
    forgeConfig,    // The raw forgeConfig this app is using, you shouldn't really have to use this
    platform,       // The platform these artifacts are for
    arch,           // The arch these artifacts are for
  }) {
    throw new Error(`Publisher ${this.name} did not implement the publish method`);
  }
}

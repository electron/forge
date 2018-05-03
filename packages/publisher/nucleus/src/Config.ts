export interface PublisherNucleusConfig {
  /**
   * Hostname (with https?://) of your instance of Nucleus
   */
  host: string;
  /**
   * App ID of your target application in Nucleus
   */
  appId: number;
  /**
   * Channel ID of your target application in Nucleus
   */
  channelId: string;
  /**
   * Authentication token for your app, you can find this on the Nucleus web UI
   */
  token: string;
}

export interface PublisherR2Config {
  /**
   * The Cloudflare Account ID
   *
   * Required. Can be found in the Cloudflare dashboard.
   */
  accountId: string;
  /**
   * The Cloudflare API Token
   *
   * Required. Create a token with R2 read and write permissions.
   */
  apiToken: string;
  /**
   * The name of the R2 bucket to upload artifacts to
   */
  bucket?: string;
  /**
   * The key prefix to upload artifacts to.
   *
   * E.g. `my/prefix`
   *
   * Default: appVersion
   */
  folder?: string;
  /**
   * Custom function to provide the key to upload a given file to
   */
  keyResolver?: (fileName: string, platform: string, arch: string) => string;
  /**
   * Custom R2 endpoint (optional)
   *
   * Default: Auto-generated from accountId
   */
  endpoint?: string;
}

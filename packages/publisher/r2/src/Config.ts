export interface PublisherR2Config {
  /**
   * The Cloudflare Account ID
   *
   * Required. Can be found in the Cloudflare dashboard.
   */
  accountId: string;
  /**
   * The R2 Access Key ID
   *
   * Required. Create an API token from the R2 dashboard.
   */
  accessKeyId: string;
  /**
   * The R2 Secret Access Key
   *
   * Required. Provided when creating an R2 API token.
   */
  secretAccessKey: string;
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
   * Default: Auto-generated from accountId as https://{accountId}.r2.cloudflarestorage.com
   */
  endpoint?: string;
  /**
   * The region to send service requests to.
   *
   * Default: 'auto'
   */
  region?: string;
}

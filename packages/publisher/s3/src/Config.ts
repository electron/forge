export interface PublisherS3Config {
  /**
   * The storage provider to use
   *
   * - 's3': AWS S3 (default)
   * - 'r2': Cloudflare R2
   *
   * Default: 's3'
   */
  provider?: 's3' | 'r2';
  /**
   * Your AWS Access Key ID (for S3) or R2 Access Key ID (for R2)
   *
   * For S3: Falls back to the default credential provider chain if not provided
   * For R2: Required
   */
  accessKeyId?: string;
  /**
   * The secret for your AWS Access Key (for S3) or R2 Secret Access Key (for R2)
   *
   * For S3: Falls back to the default credential provider chain if not provided
   * For R2: Required
   */
  secretAccessKey?: string;
  /**
   * The session token for your AWS Access Key
   *
   * Only applicable for S3. Falls back to the default credential provider chain if not provided
   */
  sessionToken?: string;
  /**
   * The Cloudflare Account ID
   *
   * Only applicable for R2. Required when provider is 'r2'.
   * Can be found in the Cloudflare dashboard.
   */
  accountId?: string;
  /**
   * The name of the S3/R2 bucket to upload artifacts to
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
   * Whether or not to make uploaded artifacts public to the internet
   *
   * Only applicable for S3.
   *
   * Default: false
   */
  public?: boolean;
  /**
   * Whether to omit the ACL when creating the S3 object. If set, `public` will have no effect.
   *
   * Only applicable for S3.
   *
   * Default: false
   */
  omitAcl?: boolean;
  /**
   * The endpoint URI to send requests to.
   *
   * For S3: Custom S3-compatible endpoint (e.g. `https://s3.example.com`)
   * For R2: Custom R2 endpoint (optional, auto-generated from accountId if not provided)
   */
  endpoint?: string;
  /**
   * The region to send service requests to.
   *
   * For S3: AWS region (e.g. `eu-west-1`)
   * For R2: Region (default: 'auto')
   */
  region?: string;
  /**
   * Whether to force path style URLs for S3 objects.
   *
   * Only applicable for S3.
   *
   * Default: false
   */
  s3ForcePathStyle?: boolean;
  /**
   * Custom function to provide the key to upload a given file to
   */
  keyResolver?: (fileName: string, platform: string, arch: string) => string;
  /**
   * Set the Cache-Control max-age metadata in S3 for the RELEASES file
   *
   * Only applicable for S3.
   *
   * Default: Cache-Control metadata is not set
   */
  releaseFileCacheControlMaxAge?: number;
}

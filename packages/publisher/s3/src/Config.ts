export interface PublisherS3Config {
  /**
   * Your AWS Access Key ID
   *
   * Falls back to the the default credential provider chain if not
   * provided
   */
  accessKeyId?: string;
  /**
   * The secret for your AWS Access Key
   *
   * Falls back to the the default credential provider chain if not
   * provided
   */
  secretAccessKey?: string;
  /**
   * The session token for your AWS Access Key
   *
   * Falls back to the the default credential provider chain if not
   * provided
   */
  sessionToken?: string;
  /**
   * The name of the S3 bucket to upload artifacts to
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
   * Default: false
   */
  public?: boolean;
  /**
   * The endpoint URI to send requests to.
   *
   * E.g. `https://s3.example.com`
   */
  endpoint?: string;
  /**
   * The region to send service requests to.
   *
   * E.g. `eu-west-1`
   */
  region?: string;
  /**
   * Whether to force path style URLs for S3 objects.
   *
   * Default: false
   */
  s3ForcePathStyle?: boolean;
  /**
   * Custom function to provide the key to upload a given file to
   */
  keyResolver?: (fileName: string, platform: string, arch: string) => string;
}

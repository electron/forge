// eslint-disable-next-line import/prefer-default-export
export interface PublisherS3Config {
  /**
   * Your AWS Access Key ID
   *
   * Falls back to the AWS_ACCESS_KEY_ID environment variable if not provided
   */
  accessKeyId?: string;
  /**
   * The secret for your AWS Access Key
   *
   * Falls back to the AWS_SECRET_ACCESS_KEY environment variable if not
   * provided
   */
  secretAccessKey?: string;
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
   * Custom function to provide the key to upload a given file to
   */
  keyResolver?: (fileName: string, platform: string, arch: string) => string;
}

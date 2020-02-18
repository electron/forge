// eslint-disable-next-line import/prefer-default-export
export interface PublisherMinioConfig {
  /**
   * Endpoint of your server. e.g. localhost
   */
  endPoint: string,
  /**
   * Port of your server. e.g. 9000
   */
  port: number,
  /**
   * Flag of SSL
   *
   * Falls back to 'false'
   */
  useSSL?: boolean,
  /**
   * Your Minio Access Key ID
   *
   * Falls back to the MINIO_ACCESS_KEY environment variable if not provided
   */
  accessKeyId?: string;
  /**
   * The secret for your Minio Access Key
   *
   * Falls back to the MINIO_SECRET_KEY environment variable if not
   * provided
   */
  secretAccessKey?: string;
  /**
   * The name of the MinIO/S3 bucket to upload artifacts to
   */
  bucket: string;
  /**
   * The key prefix to upload artifacts to.
   *
   * E.g. `my/prefix`
   *
   * Default: undefined
   */
  folder?: string;
  /**
   * Override folder configuration with appVersion
   *
   * Default: false
   */
  useAppVersionAsFolder: boolean;
  /**
   * Custom function to provide the key to upload a given file to
   */
  keyResolver?: (fileName: string, platform: string, arch: string) => string;
}

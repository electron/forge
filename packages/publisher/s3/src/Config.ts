export interface PublisherS3Config {
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  folder?: string;
  public?: boolean;
  keyResolver?: (fileName: string, platform: string, arch: string) => string;
}
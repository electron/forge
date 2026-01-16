import { StorageOptions, UploadOptions } from '@google-cloud/storage';
// import { ConfigMetadata } from '@google-cloud/storage/build';

import { GCSArtifact } from './PublisherGCS.js';

export interface PublisherGCSConfig {
  /**
   * Options passed into the `Storage` client constructor.
   * See https://cloud.google.com/nodejs/docs/reference/storage/latest/storage/storage for full reference.
   */
  storageOptions: StorageOptions;
  /**
   * The name of the Google Cloud Storage bucket where artifacts are uploaded.
   */
  bucket?: string;
  /**
   * The key prefix where artifacts are uploaded, e.g., `my/prefix`.
   *
   * Defaults to the application `version` specified in the app's `package.json`.
   */
  folder?: string;
  /**
   * Upload options to provide directly to the GCS storage upload method
   */
  uploadOptions?: UploadOptions;
  /**
   * Custom function to provide the key to upload a given file to
   */
  keyResolver?: (opts: {
    fileName: string;
    platform: string;
    arch: string;
    version: string;
  }) => string;
  /**
   * Generate optional Metadata for GCS Objects
   * See https://cloud.google.com/storage/docs/metadata for more info.
   * Expects a function that takes a GCSArtifact object and returns a `ConfigMetadata` object.
   */
  metadataGenerator?: (artifact: GCSArtifact) => any; // FIXME: ADD CONFIGMETADATA TYPE BACK
}

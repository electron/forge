import { PublisherOptions, PublisherStatic } from '@electron-forge/publisher-static';
import { Storage } from '@google-cloud/storage';
import debug from 'debug';

import { PublisherGCSConfig } from './Config';

const d = debug('electron-forge:publish:gcs');

export type GCSArtifact = {
  path: string;
  keyPrefix: string;
  platform: string;
  arch: string;
};

export default class PublisherGCS extends PublisherStatic<PublisherGCSConfig> {
  name = 'gcs';

  private GCSKeySafe = (key: string) => {
    return key.replace(/@/g, '_').replace(/\//g, '_');
  };

  async publish({ makeResults, setStatusLine }: PublisherOptions): Promise<void> {
    const artifacts: GCSArtifact[] = [];

    const { storageOptions, bucket: configBucket, folder, ...uploadOptions } = this.config;

    if (!configBucket) {
      throw new Error('In order to publish to Google Cloud Storage you must set the "bucket" property in your Forge config.');
    }

    for (const makeResult of makeResults) {
      artifacts.push(
        ...makeResult.artifacts.map((artifact) => ({
          path: artifact,
          keyPrefix: folder || this.GCSKeySafe(makeResult.packageJSON.name),
          platform: makeResult.platform,
          arch: makeResult.arch,
        }))
      );
    }

    const storage = new Storage(storageOptions);

    const bucket = storage.bucket(configBucket);

    d('creating Google Cloud Storage client with options:', this.config);

    let uploaded = 0;
    const updateStatusLine = () => setStatusLine(`Uploading distributable (${uploaded}/${artifacts.length})`);

    updateStatusLine();
    await Promise.all(
      artifacts.map(async (artifact) => {
        d('uploading:', artifact.path);
        await bucket.upload(artifact.path, {
          metadata: this.config.metadataGenerator ? this.config.metadataGenerator(artifact) : {},
          gzip: true,
          destination: this.keyForArtifact(artifact),
          ...uploadOptions,
        });

        uploaded += 1;
        updateStatusLine();
      })
    );
  }
}

export { PublisherGCS, PublisherGCSConfig };

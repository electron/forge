import path from 'path';

import { PublisherBase, PublisherOptions } from '@electron-forge/publisher-base';
import { Storage } from '@google-cloud/storage';
import debug from 'debug';

import { PublisherGCSConfig } from './Config';

const d = debug('electron-forge:publish:gcs');

type GCSArtifact = {
  path: string;
  keyPrefix: string;
  platform: string;
  arch: string;
};

export default class PublisherGCS extends PublisherBase<PublisherGCSConfig> {
  name = 'gcs';

  async publish({ makeResults, setStatusLine }: PublisherOptions): Promise<void> {
    const { config } = this;
    const artifacts: GCSArtifact[] = [];

    if (!config.bucket) {
      throw new Error('In order to publish to Google Cloud Storage you must set the "gcs.bucket" property in your Forge config.');
    }

    for (const makeResult of makeResults) {
      artifacts.push(
        ...makeResult.artifacts.map((artifact) => ({
          path: artifact,
          keyPrefix: config.folder || makeResult.packageJSON.version,
          platform: makeResult.platform,
          arch: makeResult.arch,
        }))
      );
    }

    const clientEmail = config.clientEmail || process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    const privateKey = config.privateKey || process.env.GOOGLE_CLOUD_PRIVATE_KEY;

    let credentials;
    if (clientEmail && privateKey) {
      credentials = {
        client_email: clientEmail,
        private_key: privateKey,
      };
    }

    const storage = new Storage({
      keyFilename: config.keyFilename || process.env.GOOGLE_APPLICATION_CREDENTIALS,
      credentials,
      projectId: config.projectId || process.env.GOOGLE_CLOUD_PROJECT,
    });

    const bucket = storage.bucket(config.bucket);

    d('creating Google Cloud Storage client with options:', config);

    let uploaded = 0;
    const updateStatusLine = () => setStatusLine(`Uploading distributable (${uploaded}/${artifacts.length})`);

    updateStatusLine();
    await Promise.all(
      artifacts.map(async (artifact) => {
        d('uploading:', artifact.path);

        await bucket.upload(artifact.path, {
          gzip: true,
          destination: this.keyForArtifact(artifact),
          public: config.public,
        });

        uploaded += 1;
        updateStatusLine();
      })
    );
  }

  keyForArtifact(artifact: GCSArtifact): string {
    if (this.config.keyResolver) {
      return this.config.keyResolver(path.basename(artifact.path), artifact.platform, artifact.arch);
    }

    return `${artifact.keyPrefix}/${path.basename(artifact.path)}`;
  }
}

export { PublisherGCS, PublisherGCSConfig };

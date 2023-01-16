import path from 'path';

import { PublisherBase, PublisherOptions } from '@electron-forge/publisher-base';
import { Storage } from '@google-cloud/storage';
import debug from 'debug';
import { CredentialBody } from 'google-auth-library';

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

  private GCSKeySafe = (key: string) => {
    return key.replace(/@/g, '_').replace(/\//g, '_');
  };

  async publish({ makeResults, setStatusLine }: PublisherOptions): Promise<void> {
    const artifacts: GCSArtifact[] = [];

    if (!this.config.bucket) {
      throw new Error('In order to publish to Google Cloud Storage you must set the "bucket" property in your Forge config.');
    }

    for (const makeResult of makeResults) {
      artifacts.push(
        ...makeResult.artifacts.map((artifact) => ({
          path: artifact,
          keyPrefix: this.config.folder || this.GCSKeySafe(makeResult.packageJSON.name),
          platform: makeResult.platform,
          arch: makeResult.arch,
        }))
      );
    }

    const storage = new Storage({
      keyFilename: this.config.keyFilename,
      credentials: this.generateCredentials(),
      projectId: this.config.projectId,
    });

    const bucket = storage.bucket(this.config.bucket);

    d('creating Google Cloud Storage client with options:', this.config);

    let uploaded = 0;
    const updateStatusLine = () => setStatusLine(`Uploading distributable (${uploaded}/${artifacts.length})`);

    updateStatusLine();
    await Promise.all(
      artifacts.map(async (artifact) => {
        d('uploading:', artifact.path);

        await bucket.upload(artifact.path, {
          gzip: true,
          destination: this.keyForArtifact(artifact),
          predefinedAcl: this.config.predefinedAcl,
          public: this.config.public,
          private: this.config.private,
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

    return `${artifact.keyPrefix}/${artifact.platform}/${artifact.arch}/${path.basename(artifact.path)}`;
  }

  generateCredentials(): CredentialBody | undefined {
    const clientEmail = this.config.clientEmail;
    const privateKey = this.config.privateKey;

    if (clientEmail && privateKey) {
      return {
        client_email: clientEmail,
        private_key: privateKey,
      };
    }
    return undefined;
  }
}

export { PublisherGCS, PublisherGCSConfig };

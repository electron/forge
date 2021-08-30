import { Credentials } from '@aws-sdk/types';
import debug from 'debug';
import fs from 'fs';
import path from 'path';
import { S3Client } from '@aws-sdk/client-s3';
import { Progress, Upload } from '@aws-sdk/lib-storage';

import PublisherBase, { PublisherOptions } from '@electron-forge/publisher-base';
import { asyncOra } from '@electron-forge/async-ora';

import { PublisherS3Config } from './Config';

const d = debug('electron-forge:publish:s3');

type S3Artifact = {
  path: string;
  keyPrefix: string;
  platform: string;
  arch: string;
};

function generateCredentials(config: PublisherS3Config): Credentials | undefined {
  const accessKeyId = config.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    return { accessKeyId, secretAccessKey };
  }

  return undefined;
}

export default class PublisherS3 extends PublisherBase<PublisherS3Config> {
  name = 's3';

  async publish({
    makeResults,
  }: PublisherOptions) {
    const { config } = this;
    const artifacts: S3Artifact[] = [];

    for (const makeResult of makeResults) {
      artifacts.push(...makeResult.artifacts.map((artifact) => ({
        path: artifact,
        keyPrefix: config.folder || makeResult.packageJSON.version,
        platform: makeResult.platform,
        arch: makeResult.arch,
      })));
    }

    const s3Client = new S3Client({
      credentials: generateCredentials(config),
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: !!config.s3ForcePathStyle,
    });

    if (!s3Client.config.credentials || !config.bucket) {
      throw new Error('In order to publish to s3 you must set the "s3.accessKeyId", "process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY" and "s3.bucket" properties in your Forge config. See the docs for more info');
    }

    d('creating s3 client with options:', config);

    let uploaded = 0;
    const spinnerText = () => `Uploading Artifacts ${uploaded}/${artifacts.length}`;

    await asyncOra(spinnerText(), async (uploadSpinner) => {
      await Promise.all(artifacts.map(async (artifact) => {
        d('uploading:', artifact.path);
        const uploader = new Upload({
          client: s3Client,
          params: {
            Body: fs.createReadStream(artifact.path),
            Bucket: config.bucket,
            Key: this.keyForArtifact(artifact),
            ACL: config.public ? 'public-read' : 'private',
          },
        });

        uploader.on('httpUploadProgress', (progress: Progress) => {
          if (progress.total) {
            const percentage = `${Math.round(((progress.loaded || 0) / progress.total) * 100)}%`;
            d(`Upload Progress (${path.basename(artifact.path)}) ${percentage}`);
          }
        });

        await uploader.done();
        uploaded += 1;
        uploadSpinner.text = spinnerText();
      }));
    });
  }

  keyForArtifact(artifact: S3Artifact): string {
    if (this.config.keyResolver) {
      return this.config.keyResolver(
        path.basename(artifact.path),
        artifact.platform,
        artifact.arch,
      );
    }

    return `${artifact.keyPrefix}/${path.basename(artifact.path)}`;
  }
}

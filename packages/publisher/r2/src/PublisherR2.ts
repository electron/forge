import fs from 'node:fs';
import path from 'node:path';

import { PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import {
  PublisherOptions,
  PublisherStatic,
} from '@electron-forge/publisher-static';
import debug from 'debug';
import mime from 'mime-types';

import { PublisherR2Config } from './Config';

const d = debug('electron-forge:publish:r2');

type R2Artifact = {
  path: string;
  keyPrefix: string;
  platform: string;
  arch: string;
};

export default class PublisherR2 extends PublisherStatic<PublisherR2Config> {
  name = 'r2';

  private r2KeySafe = (key: string) => {
    return key.replace(/@/g, '_').replace(/\//g, '_');
  };

  async publish({
    makeResults,
    setStatusLine,
  }: PublisherOptions): Promise<void> {
    const artifacts: R2Artifact[] = [];

    if (!this.config.bucket) {
      throw new Error(
        'In order to publish to R2, you must set the "bucket" property in your Forge publisher config. See the docs for more info',
      );
    }

    if (!this.config.accountId) {
      throw new Error(
        'In order to publish to R2, you must set the "accountId" property in your Forge publisher config.',
      );
    }

    if (!this.config.accessKeyId) {
      throw new Error(
        'In order to publish to R2, you must set the "accessKeyId" property in your Forge publisher config.',
      );
    }

    if (!this.config.secretAccessKey) {
      throw new Error(
        'In order to publish to R2, you must set the "secretAccessKey" property in your Forge publisher config.',
      );
    }

    for (const makeResult of makeResults) {
      artifacts.push(
        ...makeResult.artifacts.map((artifact) => ({
          path: artifact,
          keyPrefix:
            this.config.folder || this.r2KeySafe(makeResult.packageJSON.name),
          platform: makeResult.platform,
          arch: makeResult.arch,
        })),
      );
    }

    // Create R2 S3-compatible client
    const endpoint =
      this.config.endpoint ||
      `https://${this.config.accountId}.r2.cloudflarestorage.com`;

    const s3Client = new S3Client({
      region: this.config.region || 'auto',
      endpoint,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    d('creating r2 client with endpoint:', endpoint);

    let uploaded = 0;
    const updateStatusLine = () =>
      setStatusLine(
        `Uploading distributable (${uploaded}/${artifacts.length})`,
      );

    updateStatusLine();

    await Promise.all(
      artifacts.map(async (artifact) => {
        d('uploading:', artifact.path);

        const key = this.keyForArtifact(artifact);
        const contentType =
          mime.lookup(artifact.path) || 'application/octet-stream';

        const params: PutObjectCommandInput = {
          Body: fs.createReadStream(artifact.path),
          Bucket: this.config.bucket,
          Key: key,
          ContentType: contentType,
        };

        const upload = new Upload({
          client: s3Client,
          params,
        });

        upload.on('httpUploadProgress', (progress) => {
          d(
            `upload progress for ${path.basename(artifact.path)}:`,
            progress.loaded,
            '/',
            progress.total,
          );
        });

        await upload.done();

        d(`successfully uploaded: ${path.basename(artifact.path)}`);
        uploaded += 1;
        updateStatusLine();
      }),
    );
  }

  protected keyForArtifact(artifact: R2Artifact): string {
    const { keyPrefix, platform, arch, path: artifactPath } = artifact;

    if (this.config.keyResolver) {
      return this.config.keyResolver(
        path.basename(artifactPath),
        platform,
        arch,
      );
    }

    return `${keyPrefix}/${platform}/${arch}/${path.basename(artifactPath)}`;
  }
}

export { PublisherR2, PublisherR2Config };

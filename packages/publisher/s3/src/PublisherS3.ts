import fs from 'node:fs';
import path from 'node:path';

import { PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';
import { Progress, Upload } from '@aws-sdk/lib-storage';
import { Credentials } from '@aws-sdk/types';
import {
  PublisherOptions,
  PublisherStatic,
} from '@electron-forge/publisher-static';
import debug from 'debug';
import mime from 'mime-types';

import { PublisherS3Config } from './Config';

const d = debug('electron-forge:publish:s3');

type S3Artifact = {
  path: string;
  keyPrefix: string;
  platform: string;
  arch: string;
  isReleaseFile: boolean;
};

export default class PublisherS3 extends PublisherStatic<PublisherS3Config> {
  name = 's3';

  private s3KeySafe = (key: string) => {
    return key.replace(/@/g, '_').replace(/\//g, '_');
  };

  async publish({
    makeResults,
    setStatusLine,
  }: PublisherOptions): Promise<void> {
    const artifacts: S3Artifact[] = [];
    const provider = this.config.provider || 's3';

    if (!this.config.bucket) {
      throw new Error(
        `In order to publish to ${provider.toUpperCase()}, you must set the "bucket" property in your Forge publisher config. See the docs for more info`,
      );
    }

    // R2-specific validation
    if (provider === 'r2') {
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
    }

    for (const makeResult of makeResults) {
      artifacts.push(
        ...makeResult.artifacts.map((artifact) => ({
          path: artifact,
          keyPrefix:
            this.config.folder || this.s3KeySafe(makeResult.packageJSON.name),
          platform: makeResult.platform,
          arch: makeResult.arch,
          isReleaseFile:
            path.basename(artifact, path.extname(artifact)) === 'RELEASES',
        })),
      );
    }

    // Configure endpoint based on provider
    let endpoint = this.config.endpoint;
    if (provider === 'r2' && !endpoint) {
      endpoint = `https://${this.config.accountId}.r2.cloudflarestorage.com`;
    }

    const region =
      this.config.region || (provider === 'r2' ? 'auto' : undefined);

    const s3Client = new S3Client({
      credentials:
        provider === 'r2'
          ? {
              accessKeyId: this.config.accessKeyId!,
              secretAccessKey: this.config.secretAccessKey!,
            }
          : this.generateCredentials(),
      region,
      endpoint,
      forcePathStyle: !!this.config.s3ForcePathStyle,
    });

    d(
      `creating ${provider} client with ${endpoint ? `endpoint: ${endpoint}` : 'default endpoint'}`,
    );

    let uploaded = 0;
    const updateStatusLine = () =>
      setStatusLine(
        `Uploading distributable (${uploaded}/${artifacts.length})`,
      );

    updateStatusLine();
    await Promise.all(
      artifacts.map(async (artifact) => {
        d('uploading:', artifact.path);
        const params: PutObjectCommandInput = {
          Body: fs.createReadStream(artifact.path),
          Bucket: this.config.bucket,
          Key: this.keyForArtifact(artifact),
        };

        // S3-specific: Set ACL if not omitted
        if (provider === 's3' && !this.config.omitAcl) {
          params.ACL = this.config.public ? 'public-read' : 'private';
        }

        // S3-specific: Cache-Control for RELEASES file
        if (
          provider === 's3' &&
          artifact.isReleaseFile &&
          typeof this.config.releaseFileCacheControlMaxAge !== 'undefined' &&
          Number.isInteger(this.config.releaseFileCacheControlMaxAge) &&
          this.config.releaseFileCacheControlMaxAge >= 0
        ) {
          params.CacheControl = `max-age=${this.config.releaseFileCacheControlMaxAge}`;
        }

        // R2-specific: Set ContentType
        if (provider === 'r2') {
          params.ContentType =
            mime.lookup(artifact.path) || 'application/octet-stream';
        }

        const uploader = new Upload({
          client: s3Client,
          leavePartsOnError: true,
          params,
        });

        uploader.on('httpUploadProgress', (progress: Progress) => {
          if (progress.total) {
            const percentage = `${Math.round(((progress.loaded || 0) / progress.total) * 100)}%`;
            d(
              `Upload Progress (${path.basename(artifact.path)}) ${percentage}`,
            );
          }
        });

        await uploader.done();
        uploaded += 1;
        updateStatusLine();
      }),
    );
  }

  generateCredentials(): Credentials | undefined {
    const accessKeyId = this.config.accessKeyId;
    const secretAccessKey = this.config.secretAccessKey;
    const sessionToken = this.config.sessionToken;

    if (accessKeyId && secretAccessKey) {
      return { accessKeyId, secretAccessKey, sessionToken };
    }

    return undefined;
  }
}

export { PublisherS3, PublisherS3Config };

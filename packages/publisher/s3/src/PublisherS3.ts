import PublisherBase, { PublisherOptions } from '@electron-forge/publisher-base';
import { asyncOra } from '@electron-forge/async-ora';

import AWS from 'aws-sdk';
import debug from 'debug';
import path from 'path';

import { PublisherS3Config } from './Config';

// FIXME: Drop usage of s3 module in favor of AWS-sdk
const s3 = require('s3');

const d = debug('electron-forge:publish:s3');

(AWS as any).util.update(AWS.S3.prototype, {
  addExpect100Continue: function addExpect100Continue() {
    // Hack around large upload issue: https://github.com/andrewrk/node-s3-client/issues/74
  },
});

export default class PublisherS3 extends PublisherBase<PublisherS3Config> {
  name = 's3';

  async publish({
    makeResults,
  }: PublisherOptions) {
    const { config } = this;
    const artifacts: {
      path: string;
      keyPrefix: string;
      platform: string;
      arch: string;
    }[] = [];

    for (const makeResult of makeResults) {
      artifacts.push(...makeResult.artifacts.map(artifact => ({
        path: artifact,
        keyPrefix: config.folder || makeResult.packageJSON.version,
        platform: makeResult.platform,
        arch: makeResult.arch,
      })));
    }

    const s3Client = new AWS.S3({
      accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    });

    if (!s3Client.config.credentials || !config.bucket) {
      throw 'In order to publish to s3 you must set the "s3.accessKeyId", "process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY" and "s3.bucket" properties in your forge config. See the docs for more info'; // eslint-disable-line
    }

    d('creating s3 client with options:', config);

    const client = s3.createClient({
      s3Client,
    });
    client.s3.addExpect100Continue = () => {};

    let uploaded = 0;
    await asyncOra(`Uploading Artifacts ${uploaded}/${artifacts.length}`, async (uploadSpinner) => {
      const updateSpinner = () => {
        // eslint-disable-next-line no-param-reassign
        uploadSpinner.text = `Uploading Artifacts ${uploaded}/${artifacts.length}`;
      };

      await Promise.all(artifacts.map(artifact => new Promise(async (resolve, reject) => {
        const done = (err?: Error) => {
          if (err) return reject(err);
          uploaded += 1;
          updateSpinner();
          return resolve();
        };

        const uploader = client.uploadFile({
          localFile: artifact.path,
          s3Params: {
            Bucket: config.bucket,
            Key: this.config.keyResolver
              ? this.config.keyResolver(
                path.basename(artifact.path),
                artifact.platform,
                artifact.arch,
              )
              : `${artifact.keyPrefix}/${path.basename(artifact.path)}`,
            ACL: config.public ? 'public-read' : 'private',
          },
        });
        d('uploading:', artifact.path);

        uploader.on('error', (err: Error) => done(err));
        uploader.on('progress', () => {
          const p = `${Math.round((uploader.progressAmount / uploader.progressTotal) * 100)}%`;
          d(`Upload Progress (${path.basename(artifact.path)}) ${p}`);
        });
        uploader.on('end', () => done());
      })));
    });
  }
}

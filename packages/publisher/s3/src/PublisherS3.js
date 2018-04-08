import PublisherBase from '@electron-forge/publisher-base';
import { asyncOra } from '@electron-forge/async-ora';

import AWS from 'aws-sdk';
import debug from 'debug';
import path from 'path';
import s3 from 's3';

const d = debug('electron-forge:publish:s3');

AWS.util.update(AWS.S3.prototype, {
  addExpect100Continue: function addExpect100Continue() {
    // Hack around large upload issue: https://github.com/andrewrk/node-s3-client/issues/74
  },
});

export default class PublisherS3 extends PublisherBase {
  name = 's3';

  async publish({ makeResults, packageJSON, tag }) {
    const { config } = this;

    const artifacts = makeResults.reduce((flat, makeResult) => {
      flat.push(...makeResult.artifacts);
      return flat;
    }, []);

    const s3Client = new AWS.S3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    });

    if (!s3Client.config.credentials || !config.bucket) {
      throw 'In order to publish to s3 you must set the "s3.accessKeyId", "process.env.ELECTRON_FORGE_S3_SECRET_ACCESS_KEY" and "s3.bucket" properties in your forge config. See the docs for more info'; // eslint-disable-line
    }

    d('creating s3 client with options:', config);

    const client = s3.createClient({
      s3Client,
    });
    client.s3.addExpect100Continue = () => {};

    const folder = config.folder || tag || packageJSON.version;

    let uploaded = 0;
    await asyncOra(`Uploading Artifacts ${uploaded}/${artifacts.length}`, async (uploadSpinner) => {
      const updateSpinner = () => {
        uploadSpinner.text = `Uploading Artifacts ${uploaded}/${artifacts.length}`; // eslint-disable-line
      };

      await Promise.all(artifacts.map(artifactPath =>
        new Promise(async (resolve, reject) => {
          const done = (err) => {
            if (err) return reject(err);
            uploaded += 1;
            updateSpinner();
            resolve();
          };

          const uploader = client.uploadFile({
            localFile: artifactPath,
            s3Params: {
              Bucket: config.bucket,
              Key: `${folder}/${path.basename(artifactPath)}`,
              ACL: config.public ? 'public-read' : 'private',
            },
          });
          d('uploading:', artifactPath);

          uploader.on('error', err => done(err));
          uploader.on('progress', () => {
            d(`Upload Progress (${path.basename(artifactPath)}) ${Math.round((uploader.progressAmount / uploader.progressTotal) * 100)}%`);
          });
          uploader.on('end', () => done());
        })
      ));
    });
  }
}

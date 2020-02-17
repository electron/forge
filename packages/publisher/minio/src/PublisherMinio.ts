import PublisherBase, { PublisherOptions } from '@electron-forge/publisher-base';
import { asyncOra } from '@electron-forge/async-ora';

import debug from 'debug';
import fs from 'fs';
import path from 'path';
import { Client } from 'minio';

import { PublisherMinioConfig } from './Config';

const d = debug('electron-forge:publish:minio');

type MinioArtifact = {
  path: string;
  keyPrefix: string;
  platform: string;
  arch: string;
};

export default class PublisherMinio extends PublisherBase<PublisherMinioConfig> {
  name = 'minio';

  async publish({
    makeResults,
  }: PublisherOptions) {
    const { config } = this;
    const artifacts: MinioArtifact[] = [];

    for (const makeResult of makeResults) {
      artifacts.push(...makeResult.artifacts.map((artifact) => ({
        path: artifact,
        keyPrefix: config.folder || makeResult.packageJSON.version,
        platform: makeResult.platform,
        arch: makeResult.arch,
      })));
      d('artifact:', makeResult);
    }

    const configuration = {
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: (config.accessKeyId || process.env.MINIO_ACCESS_KEY) || '',
      secretKey: (config.secretAccessKey || process.env.MINIO_SECRET_KEY) || ''
    };


    if (!config.endPoint || !config.port || !configuration.accessKey || !configuration.secretKey || !config.bucket) {
      throw new Error('In order to publish to minio you must set the "minio.accessKey", "minio.secretKey", "minio.endPoint", "minio.port" and "bucket"');
    }
    const minioClient = new Client(configuration);

    d('creating minio client with options:', config);

    let uploaded = 0;
    const spinnerText = () => `Uploading Artifacts ${uploaded}/${artifacts.length}`;

    await asyncOra(spinnerText(), async (uploadSpinner) => {
      await Promise.all(artifacts.map(async (artifact) => {
        const fileName = path.basename(artifact.path);
        const stream = fs.createReadStream(artifact.path);

        await minioClient.putObject(config.bucket, fileName, stream);
        
        d('uploading:', fileName);
        uploaded += 1;
        uploadSpinner.text = spinnerText();
      }));
    });
  }
}

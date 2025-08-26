import path from 'node:path';

import {
  PublisherBase,
  PublisherOptions,
} from '@electron-forge/publisher-base';
import FormData from 'form-data';
import fs from 'fs-extra';
import fetch from 'node-fetch';

import { PublisherBitbucketConfig } from './Config';

export default class PublisherBitbucket extends PublisherBase<PublisherBitbucketConfig> {
  name = 'bitbucket';

  async publish({
    makeResults,
    setStatusLine,
  }: PublisherOptions): Promise<void> {
    const { config } = this;
    const hasRepositoryConfig = config.repository && typeof config.repository;
    const replaceExistingFiles = Boolean(config.replaceExistingFiles);
    const appPassword = process.env.BITBUCKET_APP_PASSWORD;
    const username = process.env.BITBUCKET_USERNAME;
    const auth = { appPassword, username, ...(config.auth || {}) };
    const apiUrl = `https://api.bitbucket.org/2.0/repositories/${config.repository.owner}/${config.repository.name}/downloads`;
    const encodedUserAndPass = Buffer.from(
      `${auth.username}:${auth.appPassword}`,
    ).toString('base64');

    if (
      !(
        hasRepositoryConfig &&
        config.repository.owner &&
        config.repository.name
      )
    ) {
      throw new Error(
        'In order to publish to Bitbucket you must set the "repository.owner" and "repository.name" properties in your Forge config. See the docs for more info',
      );
    }

    if (!auth.appPassword || !auth.username) {
      throw new Error(
        'In order to publish to Bitbucket provide credentials, either through "auth.appPassword" and "auth.username" properties in your Forge config or using BITBUCKET_APP_PASSWORD and BITBUCKET_USERNAME environment variables',
      );
    }

    for (const [index, makeResult] of makeResults.entries()) {
      const data = new FormData();

      for (const artifactPath of makeResult.artifacts) {
        data.append('files', fs.createReadStream(artifactPath));
      }

      // If we are not supposed to override an existing version, we'll check check if any of
      // the files exist first
      if (!replaceExistingFiles) {
        for (const artifactPath of makeResult.artifacts) {
          const fileName = path.basename(artifactPath);

          const response = await fetch(`${apiUrl}/${fileName}`, {
            headers: {
              Authorization: `Basic ${encodedUserAndPass}`,
            },
            method: 'HEAD',
            // We set redirect to 'manual' so that we get the 302 redirects if the file
            // already exists
            redirect: 'manual',
          });

          if (response.status === 302) {
            throw new Error(
              `Unable to publish "${fileName}" as it has been published previously. Use the "replaceExistingFiles" property in your Forge config to override this.`,
            );
          }
        }
      }

      setStatusLine(
        `Uploading distributable (${index + 1}/${makeResults.length})`,
      );
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Basic ${encodedUserAndPass}`,
        },
        method: 'POST',
        body: data,
      });

      // We will get a 200 on the inital upload and a 201 if publishing over the same version
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(
          `Unexpected response code from Bitbucket: ${response.status} ${response.statusText}\n\nBody:\n${await response.text()}`,
        );
      }
    }
  }
}

export { PublisherBitbucket, PublisherBitbucketConfig };

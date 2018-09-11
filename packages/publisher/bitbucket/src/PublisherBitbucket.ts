import PublisherBase, { PublisherOptions } from '@electron-forge/publisher-base';
import { asyncOra } from '@electron-forge/async-ora';

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs-extra';

import { PublisherBitbucketConfig } from './Config';

export default class PublisherGithub extends PublisherBase<PublisherBitbucketConfig> {
  name = 'bitbucket';

  async publish({ makeResults }: PublisherOptions) {
    const { config } = this;
    const hasRepositoryConfig = config.repository && typeof config.repository;
    const hasAuthConfig = config.auth && typeof config.auth === 'object';
    let appPassword = process.env.BITBUCKET_APP_PASSWORD;
    let bbUsername = process.env.BITBUCKET_USERNAME;

    if (!(hasRepositoryConfig && config.repository.owner && config.repository.name)) {
      throw 'In order to publish to Bitbucket you must set the "repository.owner" and "repository.name" properties in your forge config. See the docs for more info'; // eslint-disable-line
    }

    if (!(config.auth && typeof config.auth === 'object') && !appPassword && !bbUsername) {
      throw 'In order to publish to Bitbucket you must set the "auth" object in your forge config or use BITBUCKET_APP_PASSWORD and BITBUCKET_USERNAME environment variables';
    }

    appPassword = config.auth.appPassword || process.env.BITBUCKET_APP_PASSWORD;
    bbUsername = config.auth.username || process.env.BITBUCKET_USERNAME;

    if (!appPassword || !bbUsername) {
      throw 'In order to publish to Bitbucket you must set the "auth.appPassword" and "auth.username" properties in your forge config.';
    }

    for (const [index, makeResult] of makeResults.entries()) {
      const data = new FormData();

      let i = 0;
      for (const artifactPath of makeResult.artifacts) {
        data.append('files', fs.createReadStream(artifactPath));
        i += 1;
      }

      // TODO: Consider checking if the files already exist at the current version and abort if so?

      await asyncOra(`Uploading result (${index + 1}/${makeResults.length})`, async () => {
        // TODO: See if we can use this same API for bitbucket server, we could take in a `host` config if so
        const apiUrl = `https://api.bitbucket.org/2.0/repositories/${config.repository.owner}/${config.repository.name}/downloads`;
        const encodedUserAndPass = Buffer.from(`${bbUsername}:${appPassword}`).toString('base64');

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Basic ${encodedUserAndPass}`,
          },
          method: 'POST',
          body: data,
        });

        // We will get a 200 on the inital upload and a 201 if publishing over the same version
        if (response.status !== 200 && response.status !== 201) {
          throw `Unexpected response code from Bitbucket: ${response.status} ${response.statusText}\n\nBody:\n${await response.text()}`;
        }
      });
    }
  }
}

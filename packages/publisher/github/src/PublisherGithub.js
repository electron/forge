import PublisherBase from '@electron-forge/publisher-base';
import { asyncOra } from '@electron-forge/async-ora';

import fs from 'fs-extra';
import mime from 'mime-types';
import path from 'path';

import GitHub from './util/github';

export default class PublisherGithub extends PublisherBase {
  constructor() {
    super('github');
  }

  async publish({ makeResults, packageJSON, config, tag }) {
    const artifacts = makeResults.reduce((flat, makeResult) => {
      flat.push(...makeResult.artifacts);
      return flat;
    }, []);

    if (!(config.repository && typeof config.repository === 'object' &&
      config.repository.owner && config.repository.name)) {
      throw 'In order to publish to github you must set the "github_repository.owner" and "github_repository.name" properties in your forge config. See the docs for more info'; // eslint-disable-line
    }

    const github = new GitHub(config.authToken, true, config.octokitOptions);

    let release;
    await asyncOra('Searching for target release', async () => {
      try {
        release = (await github.getGitHub().repos.getReleases({
          owner: config.repository.owner,
          repo: config.repository.name,
          per_page: 100,
        })).data.find(testRelease => testRelease.tag_name === (tag || `v${packageJSON.version}`));
        if (!release) {
          throw { code: 404 };
        }
      } catch (err) {
        if (err.code === 404) {
          // Release does not exist, let's make it
          release = (await github.getGitHub().repos.createRelease({
            owner: config.repository.owner,
            repo: config.repository.name,
            tag_name: tag || `v${packageJSON.version}`,
            name: tag || `v${packageJSON.version}`,
            draft: config.repository.draft !== false,
            prerelease: config.prerelease === true,
          })).data;
        } else {
          // Unknown error
          throw err;
        }
      }
    });

    let uploaded = 0;
    await asyncOra(`Uploading Artifacts ${uploaded}/${artifacts.length}`, async (uploadSpinner) => {
      const updateSpinner = () => {
        uploadSpinner.text = `Uploading Artifacts ${uploaded}/${artifacts.length}`; // eslint-disable-line
      };

      await Promise.all(artifacts.map(artifactPath =>
        new Promise(async (resolve) => {
          const done = () => {
            uploaded += 1;
            updateSpinner();
            resolve();
          };
          if (release.assets.find(asset => asset.name === path.basename(artifactPath))) {
            return done();
          }
          await github.getGitHub().repos.uploadAsset({
            url: release.upload_url,
            file: fs.createReadStream(artifactPath),
            contentType: mime.lookup(artifactPath) || 'application/octet-stream',
            contentLength: (await fs.stat(artifactPath)).size,
            name: path.basename(artifactPath),
          });
          return done();
        })
      ));
    });
  }
}

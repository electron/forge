import { asyncOra } from '@electron-forge/async-ora';
import { ForgeMakeResult } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import mime from 'mime-types';
import path from 'path';
import PublisherBase, { PublisherOptions } from '@electron-forge/publisher-base';
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';

import GitHub from './util/github';
import NoReleaseError from './util/no-release-error';
import { PublisherGitHubConfig } from './Config';

interface GitHubRelease {
  // eslint-disable-next-line camelcase
  tag_name: string;
  assets: {
    name: string;
  }[];
  // eslint-disable-next-line camelcase
  upload_url: string;
}

export default class PublisherGithub extends PublisherBase<PublisherGitHubConfig> {
  name = 'github';

  async publish({ makeResults }: PublisherOptions): Promise<void> {
    const { config } = this;

    const perReleaseArtifacts: {
      [version: string]: ForgeMakeResult[];
    } = {};

    for (const makeResult of makeResults) {
      const release = makeResult.packageJSON.version;
      if (!perReleaseArtifacts[release]) {
        perReleaseArtifacts[release] = [];
      }
      perReleaseArtifacts[release].push(makeResult);
    }

    if (!(config.repository && typeof config.repository === 'object' && config.repository.owner && config.repository.name)) {
      throw new Error(
        'In order to publish to github you must set the "github_repository.owner" and "github_repository.name" properties in your Forge config. See the docs for more info'
      );
    }

    const github = new GitHub(config.authToken, true, config.octokitOptions);

    const octokit = github.getGitHub();
    type OctokitRelease = GetResponseDataTypeFromEndpointMethod<typeof octokit.repos.getRelease>;
    type OctokitReleaseAsset = GetResponseDataTypeFromEndpointMethod<typeof octokit.repos.updateReleaseAsset>;

    for (const releaseVersion of Object.keys(perReleaseArtifacts)) {
      let release: OctokitRelease | undefined;
      const artifacts = perReleaseArtifacts[releaseVersion];
      const releaseName = `${config.tagPrefix ?? 'v'}${releaseVersion}`;

      await asyncOra(`Searching for target release: ${releaseName}`, async () => {
        try {
          release = (
            await github.getGitHub().repos.listReleases({
              owner: config.repository.owner,
              repo: config.repository.name,
              per_page: 100,
            })
          ).data.find((testRelease: GitHubRelease) => testRelease.tag_name === releaseName);
          if (!release) {
            throw new NoReleaseError(404);
          }
        } catch (err) {
          if (err instanceof NoReleaseError && err.code === 404) {
            // Release does not exist, let's make it
            release = (
              await github.getGitHub().repos.createRelease({
                owner: config.repository.owner,
                repo: config.repository.name,
                tag_name: releaseName,
                name: releaseName,
                draft: config.draft !== false,
                prerelease: config.prerelease === true,
              })
            ).data;
          } else {
            // Unknown error
            throw err;
          }
        }
      });

      let uploaded = 0;
      await asyncOra(`Uploading Artifacts ${uploaded}/${artifacts.length} to ${releaseName}`, async (uploadSpinner) => {
        const updateSpinner = () => {
          uploadSpinner.text = `Uploading Artifacts ${uploaded}/${artifacts.length} to ${releaseName}`;
        };

        const flatArtifacts: string[] = [];
        for (const artifact of artifacts) {
          flatArtifacts.push(...artifact.artifacts);
        }

        await Promise.all(
          flatArtifacts.map(async (artifactPath) => {
            const done = () => {
              uploaded += 1;
              updateSpinner();
            };
            const artifactName = path.basename(artifactPath);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (release!.assets.find((asset: OctokitReleaseAsset) => asset.name === artifactName)) {
              return done();
            }
            await github.getGitHub().repos.uploadReleaseAsset({
              owner: config.repository.owner,
              repo: config.repository.name,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              release_id: release!.id,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              url: release!.upload_url,
              // https://github.com/octokit/rest.js/issues/1645
              data: (await fs.readFile(artifactPath)) as unknown as string,
              headers: {
                'content-type': mime.lookup(artifactPath) || 'application/octet-stream',
                'content-length': (await fs.stat(artifactPath)).size,
              },
              name: path.basename(artifactPath),
            });
            return done();
          })
        );
      });
    }
  }
}

export { PublisherGitHubConfig };

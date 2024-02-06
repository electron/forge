import path from 'node:path';

import { PublisherBase, PublisherOptions } from '@electron-forge/publisher-base';
import { ForgeMakeResult } from '@electron-forge/shared-types';
import { RequestError } from '@octokit/request-error';
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';
import chalk from 'chalk';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import mime from 'mime-types';

import { PublisherGitHubConfig } from './Config';
import GitHub from './util/github';
import NoReleaseError from './util/no-release-error';

interface GitHubRelease {
  tag_name: string;
  assets: {
    name: string;
  }[];
  upload_url: string;
}

export default class PublisherGithub extends PublisherBase<PublisherGitHubConfig> {
  name = 'github';

  async publish({ makeResults, setStatusLine }: PublisherOptions): Promise<void> {
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
        'In order to publish to GitHub, you must set the "repository.owner" and "repository.name" properties in your Forge config. See the docs for more info'
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

      setStatusLine(`Searching for target release: ${releaseName}`);
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
              generate_release_notes: config.generateReleaseNotes === true,
            })
          ).data;
        } else {
          // Unknown error
          throw err;
        }
      }

      let uploaded = 0;
      const updateUploadStatus = () => {
        setStatusLine(`Uploading distributable (${uploaded}/${artifacts.length} to ${releaseName})`);
      };
      updateUploadStatus();

      await Promise.all(
        artifacts
          .flatMap((artifact) => artifact.artifacts)
          .map(async (artifactPath) => {
            const done = () => {
              uploaded += 1;
              updateUploadStatus();
            };
            const artifactName = path.basename(artifactPath);
            const sanitizedArtifactName = GitHub.sanitizeName(artifactName);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const asset = release!.assets.find((item: OctokitReleaseAsset) => item.name === sanitizedArtifactName);
            if (asset !== undefined) {
              if (config.force === true) {
                await github.getGitHub().repos.deleteReleaseAsset({
                  owner: config.repository.owner,
                  repo: config.repository.name,
                  asset_id: asset.id,
                });
              } else {
                return done();
              }
            }
            try {
              const { data: uploadedAsset } = await github.getGitHub().repos.uploadReleaseAsset({
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
                name: artifactName,
              });
              if (uploadedAsset.name !== sanitizedArtifactName) {
                // There's definitely a bug with GitHub.sanitizeName
                console.warn(logSymbols.warning, chalk.yellow(`Expected artifact's name to be '${sanitizedArtifactName}' - got '${uploadedAsset.name}'`));
              }
            } catch (err) {
              // If an asset with that name already exists, it's either a bug with GitHub.sanitizeName
              // where it did not sanitize the artifact name in the same way as GitHub did, or there
              // was simply a race condition with uploading artifacts with the same name
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (err instanceof RequestError && err.status === 422 && (err.response?.data as any)?.errors?.[0].code === 'already_exists') {
                console.error(`Asset with name '${artifactName}' already exists - there may be a bug with Forge's GitHub.sanitizeName util`);
              }
              throw err;
            }
            return done();
          })
      );
    }
  }
}

export { PublisherGithub, PublisherGitHubConfig };

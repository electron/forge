import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ReadableStream } from 'node:stream/web';
import { styleText } from 'node:util';

import {
  PublisherBase,
  PublisherOptions,
} from '@electron-forge/publisher-base';
import { ForgeMakeResult } from '@electron-forge/shared-types';
import { RequestError } from '@octokit/request-error';
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';
import mime from 'mime-types';

import { PublisherGitHubConfig } from './Config.js';
import GitHub from './util/github.js';
import NoReleaseError from './util/no-release-error.js';

import type { Octokit } from '@octokit/rest';

interface GitHubRelease {
  tag_name: string;
  assets: {
    name: string;
  }[];
  upload_url: string;
}

type OctokitRelease = GetResponseDataTypeFromEndpointMethod<
  Octokit['repos']['getRelease']
>;
type OctokitReleaseAsset = GetResponseDataTypeFromEndpointMethod<
  Octokit['repos']['updateReleaseAsset']
>;

// Streams a file as the request body so that byte-level upload progress can be
// tracked. Octokit passes the body straight to `fetch`, which streams a
// ReadableStream body (with `duplex: 'half'`), invoking `onProgress` with the
// size of each chunk as it is sent.
function progressStream(
  filePath: string,
  onProgress: (bytes: number) => void,
): ReadableStream<Uint8Array> {
  // Pull-based so chunks are only read (and counted) as `fetch` writes them to
  // the socket, keeping the reported progress close to the real upload rate.
  const source = createReadStream(filePath);
  const iterator = source[Symbol.asyncIterator]();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await iterator.next();
      if (done) {
        controller.close();
        return;
      }
      onProgress(value.byteLength);
      controller.enqueue(new Uint8Array(value));
    },
    cancel() {
      source.destroy();
    },
  });
}

export default class PublisherGitHub extends PublisherBase<PublisherGitHubConfig> {
  name = 'github';

  // Releases we already found or created in this process, keyed by tag name.
  // GitHub's "list releases" API is eventually consistent, so a release
  // created moments ago (e.g. by a previous restored dry run) may be missing
  // from the listing, which would cause a duplicate release to be created.
  private knownReleases = new Map<string, OctokitRelease>();

  async publish({
    makeResults,
    setStatusLine,
  }: PublisherOptions): Promise<void> {
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

    if (
      !(
        config.repository &&
        typeof config.repository === 'object' &&
        config.repository.owner &&
        config.repository.name
      )
    ) {
      throw new Error(
        'In order to publish to GitHub, you must set the "repository.owner" and "repository.name" properties in your Forge config. See the docs for more info',
      );
    }

    const github = new GitHub(config.authToken, true, config.octokitOptions);
    github.getGitHub();

    for (const releaseVersion of Object.keys(perReleaseArtifacts)) {
      let release: OctokitRelease | undefined;
      const artifacts = perReleaseArtifacts[releaseVersion];
      const releaseName = `${config.tagPrefix ?? 'v'}${releaseVersion}`;

      setStatusLine(`Searching for target release: ${releaseName}`);
      try {
        release =
          this.knownReleases.get(releaseName) ??
          (
            await github.getGitHub().repos.listReleases({
              owner: config.repository.owner,
              repo: config.repository.name,
              per_page: 100,
            })
          ).data.find(
            (testRelease: GitHubRelease) =>
              testRelease.tag_name === releaseName,
          );
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

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.knownReleases.set(releaseName, release!);

      const artifactPaths = artifacts.flatMap((artifact) => artifact.artifacts);
      const artifactSizes = await Promise.all(
        artifactPaths.map(async (p) => (await fs.stat(p)).size),
      );
      const totalBytes = artifactSizes.reduce((sum, size) => sum + size, 0);

      let uploaded = 0;
      let uploadedBytes = 0;
      const updateUploadStatus = () => {
        const percent = totalBytes
          ? Math.floor((uploadedBytes / totalBytes) * 100)
          : 100;
        setStatusLine(
          `Uploading distributables to ${releaseName} (${uploaded}/${artifactPaths.length}, ${percent}%)`,
        );
      };
      updateUploadStatus();

      // Report byte-level upload progress by streaming the file to Octokit and
      // counting bytes as `fetch` pulls them from the stream (throttled to avoid
      // spamming the task output on every chunk).
      let lastStatusAt = 0;
      const reportProgress = (bytes: number) => {
        uploadedBytes += bytes;
        const now = Date.now();
        if (now - lastStatusAt >= 100) {
          lastStatusAt = now;
          updateUploadStatus();
        }
      };

      await Promise.all(
        artifactPaths.map(async (artifactPath, index) => {
          const done = () => {
            uploaded += 1;
            updateUploadStatus();
          };
          const artifactName = path.basename(artifactPath);
          const sanitizedArtifactName = GitHub.sanitizeName(artifactName);
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const asset = release!.assets.find(
            (item: OctokitReleaseAsset) => item.name === sanitizedArtifactName,
          );
          if (asset !== undefined) {
            if (config.force === true) {
              await github.getGitHub().repos.deleteReleaseAsset({
                owner: config.repository.owner,
                repo: config.repository.name,
                asset_id: asset.id,
              });
            } else {
              // Count skipped assets as fully uploaded so the percentage still totals 100%.
              reportProgress(artifactSizes[index]);
              return done();
            }
          }
          try {
            const { data: uploadedAsset } = await github
              .getGitHub()
              .repos.uploadReleaseAsset({
                owner: config.repository.owner,
                repo: config.repository.name,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                release_id: release!.id,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                url: release!.upload_url,
                // https://github.com/octokit/rest.js/issues/1645
                data: progressStream(
                  artifactPath,
                  reportProgress,
                ) as unknown as string,
                headers: {
                  'content-type':
                    mime.lookup(artifactPath) || 'application/octet-stream',
                  'content-length': artifactSizes[index],
                },
                name: artifactName,
              });
            if (uploadedAsset.name !== sanitizedArtifactName) {
              // There's definitely a bug with GitHub.sanitizeName
              console.warn(
                styleText('yellow', '⚠'),
                styleText(
                  'yellow',
                  `Expected artifact's name to be '${sanitizedArtifactName}' - got '${uploadedAsset.name}'`,
                ),
              );
            }
          } catch (err) {
            // If an asset with that name already exists, it's either a bug with GitHub.sanitizeName
            // where it did not sanitize the artifact name in the same way as GitHub did, or there
            // was simply a race condition with uploading artifacts with the same name
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (
              err instanceof RequestError &&
              err.status === 422 &&
              (err.response?.data as any)?.errors?.[0].code === 'already_exists'
            ) {
              console.error(
                `Asset with name '${artifactName}' already exists - there may be a bug with Forge's GitHub.sanitizeName util`,
              );
            }
            throw err;
          }
          return done();
        }),
      );
    }
  }
}

export { PublisherGitHub, PublisherGitHubConfig };

import path from 'path';

import asyncOra from '../util/ora-handler';
import GitHub from '../util/github';

export default async (artifacts, packageJSON, forgeConfig, authToken, tag) => {
  if (!(forgeConfig.github_repository && typeof forgeConfig.github_repository === 'object' &&
    forgeConfig.github_repository.owner && forgeConfig.github_repository.name)) {
    console.error('In order to publish to github you must set the "github_repository.owner" and "github_repository.name" properties in your forge config. See the docs for more info'.red); // eslint-disable-line
    process.exit(1);
  }

  const github = new GitHub(authToken);

  let release;
  await asyncOra('Searching for target Release', async () => {
    try {
      release = (await github.getGitHub().repos.getReleases({
        owner: forgeConfig.github_repository.owner,
        repo: forgeConfig.github_repository.name,
        per_page: 100,
      })).find(testRelease => testRelease.tag_name === (tag || `v${packageJSON.version}`));
      if (!release) {
        throw { code: 404 }; // eslint-disable-line
      }
    } catch (err) {
      if (err.code === 404) {
        // Release does not exist, let's make it
        release = await github.getGitHub().repos.createRelease({
          owner: forgeConfig.github_repository.owner,
          repo: forgeConfig.github_repository.name,
          tag_name: tag || `v${packageJSON.version}`,
          name: tag || `v${packageJSON.version}`,
          draft: true,
        });
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
          owner: forgeConfig.github_repository.owner,
          repo: forgeConfig.github_repository.name,
          id: release.id,
          filePath: artifactPath,
          name: path.basename(artifactPath),
        });
        return done();
      })
    ));
  });
};

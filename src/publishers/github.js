import debug from 'debug';
import ora from 'ora';
import path from 'path';
import GitHub from '../util/github';

const d = debug('electron-forge:publish:github');

export default async (artifacts, packageJSON, forgeConfig, authToken, tag) => {
  if (!(forgeConfig.github_repository && typeof forgeConfig.github_repository === 'object' &&
    forgeConfig.github_repository.owner && forgeConfig.github_repository.name)) {
    console.error('In order to publish to github you must set the "github_repository.owner" and "github_repository.name" properties in your forge config. See the docs for more info'.red); // eslint-disable-line
    process.exit(1);
  }

  d('identified github repository as', forgeConfig.github_repository);

  const github = new GitHub(authToken);

  let release;
  try {
    d('searching for release for tag:', `v${packageJSON.version}`);
    release = (await github.getGitHub().repos.getReleases({
      owner: forgeConfig.github_repository.owner,
      repo: forgeConfig.github_repository.name,
      per_page: 100,
    })).find(testRelease => testRelease.tag_name === (tag || `v${packageJSON.version}`));
    if (!release) {
      d('could not find existing release');
      throw { code: 404 }; // eslint-disable-line
    }
  } catch (err) {
    if (err.code === 404) {
      // Release does not exist, let's make it
      d('creating the release');
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

  let uploaded = 0;
  const uploadSpinner = ora.ora(`Uploading Artifacts ${uploaded}/${artifacts.length}`).start();
  const updateSpinner = () => {
    uploadSpinner.text = `Uploading Artifacts ${uploaded}/${artifacts.length}`;
  };

  d('About to upload', artifacts.length, 'artifacts to github release:', release.id);

  try {
    await Promise.all(artifacts.map(artifactPath =>
      new Promise(async (resolve) => {
        const done = () => {
          uploaded += 1;
          updateSpinner();
          resolve();
        };
        if (release.assets.find(asset => asset.name === path.basename(artifactPath))) {
          d('artifact:', path.basename(artifactPath), 'appears to already exist, skipping the upload');
          return done();
        }
        d('uploading:', path.basename(artifactPath));
        await github.getGitHub().repos.uploadAsset({
          owner: forgeConfig.github_repository.owner,
          repo: forgeConfig.github_repository.name,
          id: release.id,
          filePath: artifactPath,
          name: path.basename(artifactPath),
        });
        d('upload complete:', path.basename(artifactPath));
        return done();
      })
    ));
  } catch (err) {
    updateSpinner.fail();
    throw err;
  }

  uploadSpinner.succeed();
};

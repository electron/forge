import 'colors';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';
import ora from 'ora';

import './util/terminate';
import getForgeConfig from './util/forge-config';
import GitHub from './util/github';
import readPackageJSON from './util/read-package-json';
import resolveDir from './util/resolve-dir';

import make from './electron-forge-make';

const main = async () => {
  const makeResults = await make();

  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('--auth-token', 'Provided GitHub authorization token')
    .option('-t, --tag', 'The tag to publish to on GitHub')
    .allowUnknownOption(true)
    .action((cwd) => {
      if (!cwd) return;
      if (path.isAbsolute(cwd) && fs.existsSync(cwd)) {
        dir = cwd;
      } else if (fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
      }
    })
    .parse(process.argv);

  dir = await resolveDir(dir);
  if (!dir) {
    console.error('Failed to locate publishable Electron application'.red);
    if (global._resolveError) global._resolveError();
    process.exit(1);
  }

  const artifacts = makeResults.reduce((accum, arr) => {
    accum.push(...arr);
    return accum;
  }, []);

  const packageJSON = await readPackageJSON(dir);

  const forgeConfig = await getForgeConfig(dir);

  if (!(forgeConfig.github_repository && typeof forgeConfig.github_repository === 'object' &&
    forgeConfig.github_repository.owner && forgeConfig.github_repository.name)) {
    console.error('In order to publish you must set the "github_repository.owner" and "github_repository.name" properties in your forge config. See the docs for more info'.red); // eslint-disable-line
    process.exit(1);
  }

  const github = new GitHub(program.authToken);

  let release;
  try {
    release = (await github.getGitHub().repos.getReleases({
      owner: forgeConfig.github_repository.owner,
      repo: forgeConfig.github_repository.name,
      per_page: 100,
    })).find(testRelease => testRelease.tag_name === program.tag || `v${packageJSON.version}`);
    if (!release) {
      throw { code: 404 }; // eslint-disable-line
    }
  } catch (err) {
    if (err.code === 404) {
      // Release does not exist, let's make it
      release = await github.getGitHub().repos.createRelease({
        owner: forgeConfig.github_repository.owner,
        repo: forgeConfig.github_repository.name,
        tag_name: program.tag || `v${packageJSON.version}`,
        name: program.tag || `v${packageJSON.version}`,
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

  try {
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
  } catch (err) {
    updateSpinner.fail();
    throw err;
  }

  uploadSpinner.succeed();
};

main();

import 'colors';
import debug from 'debug';
import fetch from 'node-fetch';
import fs from 'fs-promise';
import inquirer from 'inquirer';
import opn from 'opn';
import os from 'os';
import path from 'path';
import pify from 'pify';
import program from 'commander';
import nugget from 'nugget';
import ora from 'ora';
import semver from 'semver';

import './util/terminate';

import darwinZipInstaller from './installers/darwin/zip';

const d = debug('electron-forge:lint');

const GITHUB_API = 'https://api.github.com';

const main = async () => {
  const searchSpinner = ora.ora('Searching for Application').start();

  let repo;

  program
    .version(require('../package.json').version)
    .arguments('[repository]')
    .action((repository) => {
      repo = repository;
    })
    .parse(process.argv);

  if (!repo || repo.indexOf('/') === -1) {
    searchSpinner.fail();
    console.error('Invalid repository name, must be in the format owner/name'.red);
    process.exit(1);
  }

  d('searching for repo:', repo);
  let releases;
  try {
    releases = await (await fetch(`${GITHUB_API}/repos/${repo}/releases`)).json();
  } catch (err) {
    // Ignore error
  }
  if (!releases || releases.message === 'Not Found' || !Array.isArray(releases)) {
    searchSpinner.fail();
    console.error(`Failed to find releases for repository "${repo}".  Please check the name and try again.`.red);
    process.exit(1);
  }

  const sortedReleases = releases.sort((releaseA, releaseB) => {
    let tagA = releaseA.tag_name;
    if (tagA.substr(0, 1) === 'v') tagA = tagA.substr(1);
    let tagB = releaseB.tag_name;
    if (tagB.substr(0, 1) === 'v') tagB = tagB.substr(1);
    return (semver.gt(tagB, tagA) ? 1 : -1);
  });
  const latestRelease = sortedReleases[0];

  searchSpinner.text = 'Searching for Releases';

  const assets = latestRelease.assets;
  if (!assets || !Array.isArray(assets)) {
    searchSpinner.fail();
    console.error('Could not find any assets for the latest release'.red);
    process.exit(1);
  }

  const installTargets = {
    win32: ['.exe'],
    darwin: ['OSX.zip', 'darwin.zip', 'macOS.zip', 'mac.zip'],
    linux: ['.rpm', '.deb', '.flatpak'],
  };

  const possibleAssets = assets.filter((asset) => {
    const targetSuffixes = installTargets[process.platform];
    for (const suffix of targetSuffixes) {
      if (asset.name.endsWith(suffix)) return true;
    }
    return false;
  });

  if (possibleAssets.length === 0) {
    searchSpinner.fail();
    console.error('Failed to find any installable assets for target platform:'.red, process.platform.cyan);
    process.exit(1);
  }

  searchSpinner.succeed();
  console.info('Found latest release:', `${latestRelease.tag_name}`.cyan);

  let targetAsset = possibleAssets[0];
  if (possibleAssets.length > 1) {
    const { assetID } = await inquirer.createPromptModule()({
      type: 'list',
      name: 'assetID',
      message: 'Multiple potential assets found, please choose one from the list below:'.cyan,
      choices: possibleAssets.map(asset => ({ name: asset.name, value: asset.id })),
    });

    targetAsset = possibleAssets.find(asset => asset.id === assetID);
  }

  const tmpdir = path.resolve(os.tmpdir(), 'forge-install');
  const pathSafeRepo = repo.replace(/\//g, '-').replace(/\\/g, '-');
  const filename = `${pathSafeRepo}-${latestRelease.tag_name}-${targetAsset.name}.forge-install`;

  const fullFilePath = path.resolve(tmpdir, filename);
  if (!await fs.exists(fullFilePath) || (await fs.stat(fullFilePath)).size !== targetAsset.size) {
    await fs.mkdirs(tmpdir);

    const nuggetOpts = {
      target: filename,
      dir: tmpdir,
      resume: true,
      strictSSL: true,
    };
    await pify(nugget)(targetAsset.browser_download_url, nuggetOpts);
  }

  const installSpinner = ora.ora('Installing Application').start();

  const installActions = {
    win32: {
      '.exe': async filePath => await opn(filePath, { wait: false }),
    },
    darwin: {
      '.zip': darwinZipInstaller,
    },
    linux: {
      '.deb': async () => {},
      '.rpm': async () => {},
      '.flatpak': async () => {},
    },
  };

  const suffixFnIdent = Object.keys(installActions[process.platform]).find(suffix => targetAsset.name.endsWith(suffix));
  await installActions[process.platform][suffixFnIdent](fullFilePath, installSpinner);

  installSpinner.succeed();
};

main();

import 'colors';
import debug from 'debug';
import fetch from 'node-fetch';
import fs from 'fs-extra';
import nugget from 'nugget';
import os from 'os';
import path from 'path';
import pify from 'pify';
import semver from 'semver';

import darwinDMGInstaller from '@electron-forge/installer-dmg';
import darwinZipInstaller from '@electron-forge/installer-zip';
import linuxDebInstaller from '@electron-forge/installer-deb';
import linuxRPMInstaller from '@electron-forge/installer-rpm';
import win32ExeInstaller from '@electron-forge/installer-exe';

import asyncOra from '../util/ora-handler';
import { info } from '../util/messages';

const d = debug('electron-forge:install');

const GITHUB_API = 'https://api.github.com';

/**
 * @typedef {Object} InstallOptions
 * @property {boolean} [interactive=false] Whether to use sensible defaults or prompt the user visually
 * @property {boolean} [prerelease=false] Whether to install prerelease versions
 * @property {string} repo The GitHub repository to install from, in the format owner/name
 * @property {function} chooseAsset A function that must return the asset to use/install from a provided array of compatible GitHub assets
 */

/**
 * Install an Electron application from GitHub. If you leave interactive as `false`, you MUST provide a `chooseAsset` function.
 *
 * @param {InstallOptions} providedOptions - Options for the install method
 * @return {Promise} Will resolve when the install process is complete
 */
export default async (providedOptions = {}) => {
  // eslint-disable-next-line prefer-const, no-unused-vars
  let { interactive, prerelease, repo, chooseAsset } = Object.assign({
    interactive: false,
    prerelease: false,
  }, providedOptions);
  asyncOra.interactive = interactive;

  if (typeof chooseAsset !== 'function') {
    throw 'Expected chooseAsset to be a function in install call';
  }

  let latestRelease;
  let possibleAssets = [];

  await asyncOra('Searching for Application', async (searchSpinner) => {
    if (!repo || repo.indexOf('/') === -1) {
      throw 'Invalid repository name, must be in the format owner/name';
    }

    d('searching for repo:', repo);
    let releases;
    try {
      releases = await (await fetch(`${GITHUB_API}/repos/${repo}/releases`)).json();
    } catch (err) {
      // Ignore error
    }

    if (!releases || releases.message === 'Not Found' || !Array.isArray(releases)) {
      throw `Failed to find releases for repository "${repo}".  Please check the name and try again.`;
    }

    releases = releases.filter(release => !release.prerelease || prerelease);

    const sortedReleases = releases.sort((releaseA, releaseB) => {
      let tagA = releaseA.tag_name;
      if (tagA.substr(0, 1) === 'v') tagA = tagA.substr(1);
      let tagB = releaseB.tag_name;
      if (tagB.substr(0, 1) === 'v') tagB = tagB.substr(1);
      return (semver.gt(tagB, tagA) ? 1 : -1);
    });
    latestRelease = sortedReleases[0];

    searchSpinner.text = 'Searching for Releases'; // eslint-disable-line

    const assets = latestRelease.assets;
    if (!assets || !Array.isArray(assets)) {
      throw 'Could not find any assets for the latest release';
    }

    const installTargets = {
      win32: [/\.exe$/],
      darwin: [/OSX.*\.zip$/, /darwin.*\.zip$/, /macOS.*\.zip$/, /mac.*\.zip$/, /\.dmg$/],
      linux: [/\.rpm$/, /\.deb$/],
    };

    possibleAssets = assets.filter((asset) => {
      const targetSuffixes = installTargets[process.platform];
      for (const suffix of targetSuffixes) {
        if (suffix.test(asset.name)) return true;
      }
      return false;
    });

    if (possibleAssets.length === 0) {
      throw `Failed to find any installable assets for target platform: ${`${process.platform}`.cyan}`;
    }
  });

  info(interactive, `Found latest release${prerelease ? ' (including prereleases)' : ''}: ${latestRelease.tag_name.cyan}`);

  let targetAsset = possibleAssets[0];
  if (possibleAssets.length > 1) {
    targetAsset = await Promise.resolve(chooseAsset(possibleAssets));
  }

  const tmpdir = path.resolve(os.tmpdir(), 'forge-install');
  const pathSafeRepo = repo.replace(/[/\\]/g, '-');
  const filename = `${pathSafeRepo}-${latestRelease.tag_name}-${targetAsset.name}`;

  const fullFilePath = path.resolve(tmpdir, filename);
  if (!await fs.pathExists(fullFilePath) || (await fs.stat(fullFilePath)).size !== targetAsset.size) {
    await fs.mkdirs(tmpdir);

    const nuggetOpts = {
      target: filename,
      dir: tmpdir,
      resume: true,
      strictSSL: true,
    };
    await pify(nugget)(targetAsset.browser_download_url, nuggetOpts);
  }

  await asyncOra('Installing Application', async (installSpinner) => {
    const installActions = {
      win32: {
        '.exe': win32ExeInstaller,
      },
      darwin: {
        '.zip': darwinZipInstaller,
        '.dmg': darwinDMGInstaller,
      },
      linux: {
        '.deb': linuxDebInstaller,
        '.rpm': linuxRPMInstaller,
      },
    };

    const suffixFnIdent = Object.keys(installActions[process.platform]).find(suffix => targetAsset.name.endsWith(suffix));
    await installActions[process.platform][suffixFnIdent](fullFilePath, installSpinner);
  });
};

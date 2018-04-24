import 'colors';
import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import fetch from 'node-fetch';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import pify from 'pify';
import semver from 'semver';

import DMGInstaller from '@electron-forge/installer-dmg';
import ZipInstaller from '@electron-forge/installer-zip';
import DebInstaller from '@electron-forge/installer-deb';
import RPMInstaller from '@electron-forge/installer-rpm';
import ExeInstaller from '@electron-forge/installer-exe';

import { info } from '../util/messages';

const nugget = require('nugget');

const d = debug('electron-forge:install');

const GITHUB_API = 'https://api.github.com';

interface Release {
  tag_name: string;
  prerelease: boolean;
  assets: Asset[];
}

export interface Asset {
  id: string;
  name: string;
  size: number;
  browser_download_url: string;
}

export interface InstallOptions {
  /**
   * Whether to use sensible defaults or prompt the user visually
   */
  interactive?: boolean;
  /**
   * Whether to install prerelease versions
   */
  prerelease?: boolean;
  /**
   * The GitHub repository to install from, in the format owner/name
   */
  repo: string;
  /**
   * A function that must return the asset to use/install from a provided array of compatible GitHub assets
   */
  chooseAsset: (assets: Asset[]) => Promise<Asset> | Asset;
}

export default async ({
  interactive = false,
  prerelease = false,
  repo,
  chooseAsset
}: InstallOptions) => {
  asyncOra.interactive = interactive;

  if (typeof chooseAsset !== 'function') {
    throw 'Expected chooseAsset to be a function in install call';
  }

  let latestRelease!: Release;
  let possibleAssets: Asset[] = [];

  await asyncOra('Searching for Application', async (searchSpinner) => {
    if (!repo || repo.indexOf('/') === -1) {
      throw 'Invalid repository name, must be in the format owner/name';
    }

    d('searching for repo:', repo);
    let releases!: Release[];
    try {
      releases = await (await fetch(`${GITHUB_API}/repos/${repo}/releases`)).json();
    } catch (err) {
      // Ignore error
    }

    if (!releases || (releases as any).message === 'Not Found' || !Array.isArray(releases)) {
      throw `Failed to find releases for repository "${repo}".  Please check the name and try again.`;
    }

    if (releases.length === 0) {
      throw `Repository "${repo}" has no releases`;
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

    const installTargets: {
      [key: string]: RegExp[];
    } = {
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
    const installActions: {
      [key: string]: {
        [key: string]: any;
      };
    } = {
      win32: {
        '.exe': ExeInstaller,
      },
      darwin: {
        '.zip': ZipInstaller,
        '.dmg': DMGInstaller,
      },
      linux: {
        '.deb': DebInstaller,
        '.rpm': RPMInstaller,
      },
    };

    const suffixFnIdent = Object.keys(installActions[process.platform]).find(suffix => targetAsset.name.endsWith(suffix));
    if (!suffixFnIdent) {
      throw `No installer to handle "${targetAsset.name}"`;
    }
    const InstallerClass = installActions[process.platform][suffixFnIdent];
    const installer = new InstallerClass();
    await installer.install({ filePath: fullFilePath, installSpinner });
  });
};

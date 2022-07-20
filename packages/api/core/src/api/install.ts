import { asyncOra } from '@electron-forge/async-ora';
import chalk from 'chalk';
import debug from 'debug';
import fetch from 'node-fetch';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import semver from 'semver';

import InstallerBase from '@electron-forge/installer-base';
import DMGInstaller from '@electron-forge/installer-dmg';
import ZipInstaller from '@electron-forge/installer-zip';
import DebInstaller from '@electron-forge/installer-deb';
import RPMInstaller from '@electron-forge/installer-rpm';
import ExeInstaller from '@electron-forge/installer-exe';

import { info } from '../util/messages';
import { downloadToFile } from '../util/download-to-file';

const d = debug('electron-forge:install');

const GITHUB_API = 'https://api.github.com';

class InstallerImpl extends InstallerBase {
  name = 'impl';
}

export interface Asset {
  id: string;
  name: string;
  size: number;
  // eslint-disable-next-line camelcase
  browser_download_url: string;
}

interface Release {
  // eslint-disable-next-line camelcase
  tag_name: string;
  prerelease: boolean;
  assets: Asset[];
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
   * A function that must return the asset to use/install from a provided array of compatible
   * GitHub assets.
   */
  chooseAsset: (assets: Asset[]) => Promise<Asset> | Asset;
}

export default async ({ interactive = false, prerelease = false, repo, chooseAsset }: InstallOptions): Promise<void> => {
  asyncOra.interactive = interactive;

  if (typeof chooseAsset !== 'function') {
    throw new Error('Expected chooseAsset to be a function in install call');
  }

  let latestRelease!: Release;
  let possibleAssets: Asset[] = [];

  await asyncOra('Searching for Application', async (searchSpinner) => {
    if (!repo || !repo.includes('/')) {
      throw new Error('Invalid repository name, must be in the format owner/name');
    }

    d('searching for repo:', repo);
    let releases!: Release[];
    try {
      releases = await (await fetch(`${GITHUB_API}/repos/${repo}/releases`)).json();
    } catch (err) {
      // Ignore error
    }

    // TODO: fix up the type so that errors are handled correctly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!releases || (releases as any).message === 'Not Found' || !Array.isArray(releases)) {
      throw new Error(`Failed to find releases for repository "${repo}".  Please check the name and try again.`);
    }

    if (releases.length === 0) {
      throw new Error(`Repository "${repo}" has no releases`);
    }

    releases = releases.filter((release) => !release.prerelease || prerelease);

    const sortedReleases = releases.sort((releaseA, releaseB) => {
      let tagA = releaseA.tag_name;
      if (tagA.substr(0, 1) === 'v') tagA = tagA.substr(1);
      let tagB = releaseB.tag_name;
      if (tagB.substr(0, 1) === 'v') tagB = tagB.substr(1);
      return semver.gt(tagB, tagA) ? 1 : -1;
    });
    // eslint-disable-next-line prefer-destructuring
    latestRelease = sortedReleases[0];

    searchSpinner.text = 'Searching for Releases';

    const { assets } = latestRelease;
    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      throw new Error('Could not find any assets for the latest release');
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
      throw new Error(`Failed to find any installable assets for target platform: ${chalk.cyan(`${process.platform}`)}`);
    }
  });

  info(interactive, `Found latest release${prerelease ? ' (including prereleases)' : ''}: ${chalk.cyan(latestRelease.tag_name)}`);

  let targetAsset = possibleAssets[0];
  if (possibleAssets.length > 1) {
    targetAsset = await Promise.resolve(chooseAsset(possibleAssets));
  }

  const tmpdir = path.resolve(os.tmpdir(), 'forge-install');
  const pathSafeRepo = repo.replace(/[/\\]/g, '-');
  const filename = `${pathSafeRepo}-${latestRelease.tag_name}-${targetAsset.name}`;

  const fullFilePath = path.resolve(tmpdir, filename);
  if (!(await fs.pathExists(fullFilePath)) || (await fs.stat(fullFilePath)).size !== targetAsset.size) {
    await fs.mkdirs(tmpdir);
    await downloadToFile(fullFilePath, targetAsset.browser_download_url);
  }

  await asyncOra('Installing Application', async (installSpinner) => {
    const installActions: {
      [key: string]: {
        [key: string]: typeof InstallerImpl;
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

    const suffixFnIdent = Object.keys(installActions[process.platform]).find((suffix) => targetAsset.name.endsWith(suffix));
    if (!suffixFnIdent) {
      throw new Error(`No installer to handle "${targetAsset.name}"`);
    }
    const InstallerClass = installActions[process.platform][suffixFnIdent];
    const installer = new InstallerClass();
    await installer.install({ installSpinner, filePath: fullFilePath });
  });
};

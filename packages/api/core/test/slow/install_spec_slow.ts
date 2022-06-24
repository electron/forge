import chalk from 'chalk';
import { expect } from 'chai';
import fetchMock, { FetchMockSandbox } from 'fetch-mock';
import proxyquire from 'proxyquire';
import { SinonSpy, spy, stub } from 'sinon';

import { InstallOptions, InstallAsset } from '../../src/api';

describe('install', () => {
  let install: (opts: InstallOptions) => Promise<void>;
  let downloadToFileSpy: SinonSpy;
  let fetch: FetchMockSandbox;
  class MockInstaller {
    async install() {
      return undefined;
    }
  }
  const chooseAsset = (arr: InstallAsset[]) => arr[0];

  beforeEach(() => {
    fetch = fetchMock.sandbox();
    downloadToFileSpy = stub();

    install = proxyquire.noCallThru().load('../../src/api/install', {
      'node-fetch': fetch,
      '../../src/util/download-to-file': { downloadToFile: downloadToFileSpy },
      '@electron-forge/installer-dmg': MockInstaller,
      '@electron-forge/installer-zip': MockInstaller,
      '@electron-forge/installer-deb': MockInstaller,
      '@electron-forge/installer-rpm': MockInstaller,
      '@electron-forge/installer-exe': MockInstaller,
    }).default;
  });

  afterEach(() => {
    fetch.restore();
  });

  it('should throw an error when a repo name is not given', async () => {
    await expect(install({} as InstallOptions)).to.eventually.be.rejected;
  });

  it('should throw an error when given an invalid repository name', async () => {
    await expect(install({ chooseAsset, repo: 'foobar', interactive: false })).to.eventually.be.rejected;
  });

  it('should throw an error if the fetch fails', async () => {
    fetch.get('*', {
      throws: new Error('it broke'),
    });
    await expect(install({ chooseAsset, repo: 'a/b', interactive: false })).to.eventually.be.rejectedWith(
      'Failed to find releases for repository "a/b".  Please check the name and try again.'
    );
  });

  it("should throw an error if we can't find the repo", async () => {
    fetch.get('*', {
      message: 'Not Found',
    });
    await expect(install({ chooseAsset, repo: 'b/c', interactive: false })).to.eventually.be.rejectedWith(
      'Failed to find releases for repository "b/c".  Please check the name and try again.'
    );
  });

  it('should throw an error if the API does not return a release array', async () => {
    fetch.get('*', {
      lolz: 'this aint no array',
    });
    await expect(install({ chooseAsset, repo: 'c/d', interactive: false })).to.eventually.be.rejectedWith(
      'Failed to find releases for repository "c/d".  Please check the name and try again.'
    );
  });

  it('should throw an error if the latest release has no assets', async () => {
    fetch.get('*', [{ tag_name: 'v1.0.0' }, { tag_name: '0.3.0' }, { tag_name: 'v1.2.0' }, { tag_name: '0.1.0' }]);
    await expect(install({ chooseAsset, repo: 'e/f', interactive: false })).to.eventually.be.rejectedWith('Could not find any assets for the latest release');
  });

  it('should throw an error if there are no release compatible with the current platform', async () => {
    fetch.get('*', [
      {
        tag_name: '1.0.0',
        assets: [
          {
            name: 'installer.unicorn',
          },
        ],
      },
    ]);
    await expect(install({ chooseAsset, repo: 'f/g', interactive: false })).to.eventually.be.rejectedWith(
      `Failed to find any installable assets for target platform: ${chalk.cyan(process.platform)}`
    );
  });

  // eslint-disable-next-line no-nested-ternary
  const compatSuffix = process.platform === 'darwin' ? 'dmg' : process.platform === 'win32' ? 'exe' : 'deb';

  it('should download a release if there is a single compatible asset', async () => {
    fetch.get('*', [
      {
        tag_name: '1.0.0',
        assets: [
          {
            name: `installer.${compatSuffix}`,
            browser_download_url: 'fetch.it',
          },
        ],
      },
    ]);
    expect(downloadToFileSpy.callCount).to.equal(0);
    await install({ chooseAsset, repo: 'g/h', interactive: false });
    expect(downloadToFileSpy.callCount).to.equal(1);
    expect(downloadToFileSpy.firstCall.args[1]).to.equal('fetch.it');
  });

  it('should throw an error if there is more than one compatible asset with no chooseAsset method', async () => {
    fetch.get('*', [
      {
        tag_name: '1.0.0',
        assets: [
          {
            name: `installer.${compatSuffix}`,
            browser_download_url: 'fetch.it',
          },
          {
            name: `installer2.${compatSuffix}`,
            browser_download_url: 'fetch.it.2',
          },
        ],
      },
    ]);
    await expect(install({ repo: 'h/i', interactive: false } as InstallOptions)).to.eventually.be.rejectedWith(
      'Expected chooseAsset to be a function in install call'
    );
  });

  it('should provide compatible assets to chooseAsset if more than one exists', async () => {
    const chooseAssetSpy = spy(async (assets: InstallAsset[]) => assets[0]);
    fetch.get('*', [
      {
        tag_name: '1.0.0',
        assets: [
          {
            name: `installer.${compatSuffix}`,
            browser_download_url: 'fetch.it',
          },
          {
            name: `installer2.${compatSuffix}`,
            browser_download_url: 'fetch.it.2',
          },
        ],
      },
    ]);
    expect(chooseAssetSpy.callCount).to.equal(0);
    await install({ repo: 'i/j', interactive: false, chooseAsset: chooseAssetSpy });
    expect(chooseAssetSpy.callCount).to.equal(1);
    expect(chooseAssetSpy.firstCall.args[0].length).to.equal(2);
  });
});

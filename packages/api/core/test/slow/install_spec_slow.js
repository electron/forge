import chai, { expect } from 'chai';
import fetchMock from 'fetch-mock/es5/server';
import chaiAsPromised from 'chai-as-promised';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

chai.use(chaiAsPromised);

describe('install', () => {
  let install;
  let nuggetSpy;
  let mockInquirer;
  let fetch;
  const mockInstaller = () => Promise.resolve();
  const chooseAsset = arr => arr[0];

  beforeEach(() => {
    fetch = fetchMock.sandbox();
    nuggetSpy = sinon.stub();
    mockInquirer = {
      createPromptModule: sinon.spy(() => sinon.spy(() => Promise.resolve({ assetID: 1 }))),
    };

    install = proxyquire.noCallThru().load('../../src/api/install', {
      'node-fetch': fetch,
      nugget: (...args) => {
        nuggetSpy(...args);
        args[args.length - 1]();
      },
      '@electron-forge/installer-dmg': mockInstaller,
      '@electron-forge/installer-zip': mockInstaller,
      '.@electron-forge/installer-deb': mockInstaller,
      '@electron-forge/installer-rpm': mockInstaller,
      '@electron-forge/installer-exe': mockInstaller,
    }).default;
  });

  afterEach(() => {
    fetch.restore();
  });

  it('should throw an error when a repo name is not given', async () => {
    await expect(install()).to.eventually.be.rejected;
  });

  it('should throw an error when given an invalid repository name', async () => {
    await expect(install({ repo: 'foobar', interactive: false, chooseAsset })).to.eventually.be.rejected;
  });

  it('should throw an error if the fetch fails', async () => {
    fetch.get('*', {
      throws: new Error('it broke'),
    });
    await expect(install({ repo: 'a/b', interactive: false, chooseAsset })).to.eventually.be.rejectedWith(
      'Failed to find releases for repository "a/b".  Please check the name and try again.'
    );
  });

  it('should throw an error if we can\'t find the repo', async () => {
    fetch.get('*', {
      message: 'Not Found',
    });
    await expect(install({ repo: 'b/c', interactive: false, chooseAsset })).to.eventually.be.rejectedWith(
      'Failed to find releases for repository "b/c".  Please check the name and try again.'
    );
  });

  it('should throw an error if the API does not return a release array', async () => {
    fetch.get('*', {
      lolz: 'this aint no array',
    });
    await expect(install({ repo: 'c/d', interactive: false, chooseAsset })).to.eventually.be.rejectedWith(
      'Failed to find releases for repository "c/d".  Please check the name and try again.'
    );
  });

  it('should throw an error if the latest release has no assets', async () => {
    fetch.get('*', [
      { tag_name: 'v1.0.0' },
      { tag_name: '0.3.0' },
      { tag_name: 'v1.2.0' },
      { tag_name: '0.1.0' },
    ]);
    await expect(install({ repo: 'e/f', interactive: false, chooseAsset })).to.eventually.be.rejectedWith(
      'Could not find any assets for the latest release'
    );
  });

  it('should throw an error if there are no release compatable with the current platform', async () => {
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
    await expect(install({ repo: 'f/g', interactive: false, chooseAsset })).to.eventually.be.rejectedWith(
      `Failed to find any installable assets for target platform: ${`${process.platform}`.cyan}`
    );
  });

  // eslint-disable-next-line no-nested-ternary
  const compatSuffix = process.platform === 'darwin' ? 'dmg' : (process.platform === 'win32' ? 'exe' : 'deb');

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
    expect(nuggetSpy.callCount).to.equal(0);
    await install({ repo: 'g/h', interactive: false, chooseAsset });
    expect(nuggetSpy.callCount).to.equal(1);
    expect(nuggetSpy.firstCall.args[0]).to.equal('fetch.it');
  });

  it('should throw an error if there is more than one compatable asset with no chooseAsset method', async () => {
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
    await expect(install({ repo: 'h/i', interactive: false })).to.eventually.be.rejectedWith(
      'Expected chooseAsset to be a function in install call'
    );
  });

  it('should provide compatable assets to chooseAsset if more than one exists', async () => {
    const chooseAssetSpy = sinon.spy(async assets => assets[0]);
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

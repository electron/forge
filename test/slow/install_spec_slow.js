import chai, { expect } from 'chai';
import fetchMock from 'fetch-mock';
import chaiAsPromised from 'chai-as-promised';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

chai.use(chaiAsPromised);

describe('install', () => {
  let install;
  let nuggetSpy;
  let mockInquirer;
  const mockInstaller = () => Promise.resolve();

  beforeEach(() => {
    nuggetSpy = sinon.stub();
    mockInquirer = {
      createPromptModule: sinon.spy(() => sinon.spy(() => Promise.resolve({ assetID: 1 }))),
    };

    install = proxyquire.noCallThru().load('../../src/api/install', {
      'node-fetch': fetchMock.fetchMock,
      nugget: (...args) => {
        nuggetSpy(...args);
        args[args.length - 1]();
      },
      '../installers/darwin/dmg': mockInstaller,
      '../installers/darwin/zip': mockInstaller,
      '../installers/linux/deb': mockInstaller,
      '../installers/linux/rpm': mockInstaller,
      '../installers/win32/exe': mockInstaller,
      inquirer: mockInquirer,
    }).default;
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should throw an error when a repo name is not given', async () => {
    await expect(install()).to.eventually.be.rejected;
  });

  it('should throw an error when given an invalid repository name', async () => {
    await expect(install({ repo: 'foobar', interactive: false })).to.eventually.be.rejected;
  });

  it('should throw an error if the fetch fails', async () => {
    fetchMock.get('*', {
      throws: new Error('it broke'),
    });
    await expect(install({ repo: 'a/b', interactive: false })).to.eventually.be.rejectedWith(
      'Failed to find releases for repository "a/b".  Please check the name and try again.'
    );
  });

  it('should throw an error if we can\'t find the repo', async () => {
    fetchMock.get('*', {
      message: 'Not Found',
    });
    await expect(install({ repo: 'b/c', interactive: false })).to.eventually.be.rejectedWith(
      'Failed to find releases for repository "b/c".  Please check the name and try again.'
    );
  });

  it('should throw an error if the API does not return a release array', async () => {
    fetchMock.get('*', {
      lolz: 'this aint no array',
    });
    await expect(install({ repo: 'c/d', interactive: false })).to.eventually.be.rejectedWith(
      'Failed to find releases for repository "c/d".  Please check the name and try again.'
    );
  });

  it('should throw an error if the latest release has no assets', async () => {
    fetchMock.get('*', [
      { tag_name: 'v1.0.0' },
      { tag_name: '0.3.0' },
      { tag_name: 'v1.2.0' },
      { tag_name: '0.1.0' },
    ]);
    await expect(install({ repo: 'e/f', interactive: false })).to.eventually.be.rejectedWith(
      'Could not find any assets for the latest release'
    );
  });

  it('should throw an error if there are no release compatable with the current platform', async () => {
    fetchMock.get('*', [
      {
        tag_name: '1.0.0',
        assets: [
          {
            name: 'installer.unicorn',
          },
        ],
      },
    ]);
    await expect(install({ repo: 'f/g', interactive: false })).to.eventually.be.rejectedWith(
      `Failed to find any installable assets for target platform: ${`${process.platform}`.cyan}`
    );
  });

  // eslint-disable-next-line no-nested-ternary
  const compatSuffix = process.platform === 'darwin' ? 'dmg' : (process.platform === 'win32' ? 'exe' : 'deb');

  it('should download a release if there is a single compatable asset', async () => {
    fetchMock.get('*', [
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
    await install({ repo: 'g/h', interactive: false });
    expect(nuggetSpy.callCount).to.equal(1);
    expect(nuggetSpy.firstCall.args[0]).to.equal('fetch.it');
  });

  it('should throw an error if there is more than compatable asset with no chooseAsset method', async () => {
    fetchMock.get('*', [
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
      'expected a chooseAsset function to be provided but it was not'
    );
  });

  it('should provide compatable assets to chooseAsset if more than one exists', async () => {
    const chooseAsset = sinon.spy(async assets => assets[0]);
    fetchMock.get('*', [
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
    expect(chooseAsset.callCount).to.equal(0);
    await install({ repo: 'i/j', interactive: false, chooseAsset });
    expect(chooseAsset.callCount).to.equal(1);
    expect(chooseAsset.firstCall.args[0].length).to.equal(2);
  });

  it('should prompt the user to choose an asset if in interactive mode and more than one exists', async () => {
// mockInquirer
    fetchMock.get('*', [
      {
        tag_name: '1.0.0',
        assets: [
          {
            id: 1,
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
    expect(mockInquirer.createPromptModule.callCount).to.equal(0);
    await install({ repo: 'j/k', interactive: true });
    expect(mockInquirer.createPromptModule.callCount).to.equal(1);
  });
});

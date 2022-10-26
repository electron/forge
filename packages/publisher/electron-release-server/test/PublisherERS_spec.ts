import { ForgeConfig, ForgeMakeResult } from '@electron-forge/shared-types';
import { expect } from 'chai';
import fetchMock from 'fetch-mock';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

describe('PublisherERS', () => {
  let fetch: typeof fetchMock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let PublisherERS: any;

  beforeEach(() => {
    fetch = fetchMock.sandbox();
    PublisherERS = proxyquire.noCallThru().load('../src/PublisherERS', {
      'node-fetch': fetch,
      'fs-extra': { createReadStream: stub().returns(''), statSync: stub().returns({ size: 100 }) },
    }).default;
  });

  afterEach(() => {
    fetch.restore();
  });

  describe('new version', () => {
    it('can publish a new version to ERS', async () => {
      const baseUrl = 'https://example.com';
      const token = 'FAKE_TOKEN';
      const flavor = 'lite';
      const version = '3.0.0';

      // mock login
      fetch.postOnce('path:/api/auth/login', { body: { token }, status: 200 });
      // mock fetch all existing versions
      fetch.getOnce('path:/api/version', { body: [{ name: '2.0.0', assets: [], flavor: 'default' }], status: 200 });
      // mock creating a new version
      fetch.postOnce('path:/api/version', { status: 200 });
      // mock asset upload
      fetch.post('path:/api/asset', { status: 200 });

      const publisher = new PublisherERS({
        baseUrl,
        username: 'test',
        password: 'test',
        flavor,
      });

      const makeResults: ForgeMakeResult[] = [
        {
          artifacts: ['/path/to/artifact'],
          packageJSON: {
            version,
          },
          platform: 'linux',
          arch: 'x64',
        },
      ];

      await publisher.publish({ makeResults, dir: '', forgeConfig: {} as ForgeConfig });

      const calls = fetch.calls();

      // creates a new version with the correct flavor, name, and channel
      expect(calls[2][0]).to.equal(`${baseUrl}/api/version`);
      expect(calls[2][1]?.body).to.equal(`{"channel":{"name":"stable"},"flavor":"${flavor}","name":"${version}","notes":""}`);

      // uploads asset successfully
      expect(calls[3][0]).to.equal(`${baseUrl}/api/asset`);
    });
  });

  describe('existing version', () => {
    it('can add new assets', async () => {
      const baseUrl = 'https://example.com';
      const token = 'FAKE_TOKEN';
      const channel = 'stable';
      const flavor = 'lite';
      const version = '2.0.0';

      // mock login
      fetch.postOnce('path:/api/auth/login', { body: { token }, status: 200 });
      // mock fetch all existing versions
      fetch.getOnce('path:/api/version', { body: [{ name: '2.0.0', assets: [], flavor: 'lite' }], status: 200 });
      // mock asset upload
      fetch.post('path:/api/asset', { status: 200 });

      const publisher = new PublisherERS({
        baseUrl,
        username: 'test',
        password: 'test',
        channel,
        flavor,
      });

      const makeResults: ForgeMakeResult[] = [
        {
          artifacts: ['/path/to/artifact'],
          packageJSON: {
            version,
          },
          platform: 'linux',
          arch: 'x64',
        },
      ];

      await publisher.publish({ makeResults, dir: '', forgeConfig: {} as ForgeConfig });

      const calls = fetch.calls();

      // uploads asset successfully
      expect(calls[2][0]).to.equal(`${baseUrl}/api/asset`);
    });

    it('does not replace assets for existing version', async () => {
      const baseUrl = 'https://example.com';
      const token = 'FAKE_TOKEN';
      const channel = 'stable';
      const version = '2.0.0';

      // mock login
      fetch.postOnce('path:/api/auth/login', { body: { token }, status: 200 });
      // mock fetch all existing versions
      fetch.getOnce('path:/api/version', { body: [{ name: '2.0.0', assets: [{ name: 'existing-artifact' }], flavor: 'default' }], status: 200 });

      const publisher = new PublisherERS({
        baseUrl,
        username: 'test',
        password: 'test',
        channel,
      });

      const makeResults: ForgeMakeResult[] = [
        {
          artifacts: ['/path/to/existing-artifact'],
          packageJSON: {
            version,
          },
          platform: 'linux',
          arch: 'x64',
        },
      ];

      await publisher.publish({ makeResults, dir: '', forgeConfig: {} as ForgeConfig });

      const calls = fetch.calls();
      expect(calls).to.have.length(2);
    });

    it('can upload a new flavor for an existing version', async () => {
      const baseUrl = 'https://example.com';
      const token = 'FAKE_TOKEN';
      const version = '2.0.0';
      const flavor = 'lite';

      // mock login
      fetch.postOnce('path:/api/auth/login', { body: { token }, status: 200 });
      // mock fetch all existing versions
      fetch.getOnce('path:/api/version', { body: [{ name: '2.0.0', assets: [{ name: 'existing-artifact' }], flavor: 'default' }], status: 200 });
      // mock creating a new version
      fetch.postOnce('path:/api/version', { status: 200 });
      // mock asset upload
      fetch.post('path:/api/asset', { status: 200 });

      const publisher = new PublisherERS({
        baseUrl,
        username: 'test',
        password: 'test',
        flavor,
      });

      const makeResults: ForgeMakeResult[] = [
        {
          artifacts: ['/path/to/artifact'],
          packageJSON: {
            version,
          },
          platform: 'linux',
          arch: 'x64',
        },
      ];

      await publisher.publish({ makeResults, dir: '', forgeConfig: {} as ForgeConfig });

      const calls = fetch.calls();

      // creates a new version with the correct flavor, name, and channel
      expect(calls[2][0]).to.equal(`${baseUrl}/api/version`);
      expect(calls[2][1]?.body).to.equal(`{"channel":{"name":"stable"},"flavor":"${flavor}","name":"${version}","notes":""}`);

      // uploads asset successfully
      expect(calls[3][0]).to.equal(`${baseUrl}/api/asset`);
    });

    // TODO: implement edge cases
    it('can read the channel from the package.json version');
    it('does not upload the RELEASES file');
  });

  it('fails if username and password are not provided', () => {
    const publisher = new PublisherERS({});

    expect(publisher.publish({ makeResults: [], dir: '', forgeConfig: {} as ForgeConfig })).to.eventually.be.rejectedWith(
      'In order to publish to ERS you must set the "electronReleaseServer.baseUrl", "electronReleaseServer.username" and "electronReleaseServer.password" properties in your Forge config. See the docs for more info'
    );
  });

  it('fails if the server returns 4xx', async () => {
    fetch.mock('begin:http://example.com', { body: {}, status: 400 });

    const publisher = new PublisherERS({
      baseUrl: 'http://example.com',
      username: 'test',
      password: 'test',
    });
    return expect(publisher.publish({ makeResults: [], dir: '', forgeConfig: {} as ForgeConfig })).to.eventually.be.rejectedWith(
      'ERS publish failed with status code: 400 (http://example.com/api/auth/login)'
    );
  });
});

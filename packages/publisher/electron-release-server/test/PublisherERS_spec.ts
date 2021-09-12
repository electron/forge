import { expect } from 'chai';
import { ForgeConfig } from '@electron-forge/shared-types';
import fetchMock from 'fetch-mock';
import proxyquire from 'proxyquire';

describe('PublisherERS', () => {
  let fetch: typeof fetchMock;
  beforeEach(() => {
    fetch = fetchMock.sandbox();
  });
  it('fail if the server returns 4xx', async () => {
    fetch.mock('begin:http://example.com', { body: {}, status: 400 });
    const PublisherERS = proxyquire.noCallThru().load('../src/PublisherERS', {
      'node-fetch': fetch,
    }).default;

    const publisher = new PublisherERS({
      baseUrl: 'http://example.com',
      username: 'test',
      password: 'test',
    });
    return expect(publisher.publish({ makeResults: [], dir: '', forgeConfig: {} as ForgeConfig })).to.eventually.be.rejectedWith(
      'ERS publish failed with status code: 400 (http://example.com/api/auth/login)'
    );
  });

  afterEach(() => {
    fetch.restore();
  });
});

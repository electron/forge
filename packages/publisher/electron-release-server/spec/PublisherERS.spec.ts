import { ForgeMakeResult, ResolvedForgeConfig } from '@electron-forge/shared-types';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { PublisherERS } from '../src/PublisherERS';

const noop = () => void 0;

const baseUrl = 'https://example.com';
const token = 'FAKE_TOKEN';
const flavor = 'lite';
const version = '3.0.0';

vi.mock(import('fs-extra'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: {
      ...mod.default,
      statSync: vi.fn().mockReturnValue({
        size: 1337,
      }),
    },
  };
});

const server = setupServer(
  http.post('https://example.com/api/auth/login', () => HttpResponse.json({ token })),
  http.get('https://example.com/versions/sorted', () =>
    HttpResponse.json({ total: 0, offset: 0, page: 0, items: [{ name: '2.0.0', assets: [], flavor: { name: 'default' } }] })
  ),
  http.post('https://example.com/api/version', () => {
    return HttpResponse.json({});
  }),
  http.post('https://example.com/api/asset', () => HttpResponse.json({}))
);

describe('PublisherERS', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  describe('new version', () => {
    it('can publish a new version to ERS', async () => {
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

      const requests: Request[] = [];
      server.events.on('request:start', ({ request }) => {
        requests.push(request);
      });

      await publisher.publish({ makeResults, dir: '', forgeConfig: {} as ResolvedForgeConfig, setStatusLine: noop });

      expect(requests).toHaveLength(4);
      // creates a new version with the correct flavor, name, and channel
      expect(requests[2].url).toEqual(`${baseUrl}/api/version`);
      await expect(requests[2].json()).resolves.toEqual({ channel: 'stable', flavor, name: version, notes: '', id: `${version}_stable` });
      // uploads asset successfully
      expect(requests[3].url).toEqual(`${baseUrl}/api/asset`);
    });
  });

  describe('existing version', () => {
    it('can add new assets', async () => {
      const channel = 'stable';
      const flavor = 'lite';
      const version = '2.0.0';

      // mock fetch all existing versions
      server.use(
        http.get('https://example.com/versions/sorted', () =>
          HttpResponse.json({ total: 1, offset: 0, page: 0, items: [{ name: '2.0.0', assets: [], flavor: { name: 'lite' } }] })
        )
      );

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

      const requests: Request[] = [];
      server.events.on('request:start', ({ request }) => {
        requests.push(request);
      });

      await publisher.publish({ makeResults, dir: '', forgeConfig: {} as ResolvedForgeConfig, setStatusLine: noop });
      expect(requests).toHaveLength(3);
      // uploads asset successfully
      expect(requests[2].url).toEqual(`${baseUrl}/api/asset`);
    });

    it('does not replace assets for existing version', async () => {
      const channel = 'stable';
      const version = '2.0.0';

      // mock fetch all existing versions
      server.use(
        http.get('https://example.com/versions/sorted', () =>
          HttpResponse.json({
            total: 1,
            offset: 0,
            page: 0,
            items: [{ name: '2.0.0', assets: [{ name: 'existing-artifact', platform: 'linux_64' }], flavor: { name: 'default' } }],
          })
        )
      );

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

      const requests: Request[] = [];
      server.events.on('request:start', ({ request }) => {
        requests.push(request);
      });

      await publisher.publish({ makeResults, dir: '', forgeConfig: {} as ResolvedForgeConfig, setStatusLine: noop });

      expect(requests).not.toContainEqual(expect.objectContaining({ url: `${baseUrl}/api/asset` }));
    });

    it('can upload a new flavor for an existing version', async () => {
      const version = '2.0.0';
      const flavor = 'lite';

      // mock fetch all existing versions
      server.use(
        http.get('https://example.com/versions/sorted', () =>
          HttpResponse.json({
            total: 1,
            offset: 0,
            page: 0,
            items: [{ name: '2.0.0', assets: [{ name: 'existing-artifact', platform: 'linux_64' }], flavor: { name: 'default' } }],
          })
        )
      );

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

      const requests: Request[] = [];
      server.events.on('request:start', ({ request }) => {
        requests.push(request);
      });

      await publisher.publish({ makeResults, dir: '', forgeConfig: {} as ResolvedForgeConfig, setStatusLine: noop });

      expect(requests).toHaveLength(4);

      // creates a new version with the correct flavor, name, and channel
      expect(requests[2].url).toEqual(`${baseUrl}/api/version`);
      await expect(requests[2].json()).resolves.toEqual({
        channel: 'stable',
        flavor,
        name: version,
        notes: '',
        id: `${version}_stable`,
      });

      // uploads asset successfully
      expect(requests[3].url).toEqual(`${baseUrl}/api/asset`);
    });

    // TODO: implement edge cases
    it.todo('can read the channel from the package.json version');
    it.todo('does not upload the RELEASES file');
  });

  it('fails if username and password are not provided', async () => {
    // @ts-expect-error testing invalid options
    const publisher = new PublisherERS({});

    await expect(publisher.publish({ makeResults: [], dir: '', forgeConfig: {} as ResolvedForgeConfig, setStatusLine: noop })).rejects.toThrow(
      'In order to publish to ERS you must set the "electronReleaseServer.baseUrl", "electronReleaseServer.username" and "electronReleaseServer.password" properties in your Forge config. See the docs for more info'
    );
  });

  it('fails if the server returns 4xx', async () => {
    server.use(http.post('https://example.com/api/auth/login', () => HttpResponse.json({ error: 'Not Authorized' }, { status: 401 })));

    const publisher = new PublisherERS({
      baseUrl,
      username: 'test',
      password: 'test',
    });
    return expect(publisher.publish({ makeResults: [], dir: '', forgeConfig: {} as ResolvedForgeConfig, setStatusLine: noop })).rejects.toThrow(
      'ERS publish failed with status code: 401 (https://example.com/api/auth/login)'
    );
  });
});

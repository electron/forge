import os from 'os';
import path from 'path';

import { ForgeArch } from '@electron-forge/shared-types';
import { expect } from 'chai';
import fs from 'fs-extra';
import got from 'got';
import { SinonStub, stub } from 'sinon';

import { MakerZIPConfig } from '../src/Config';
import { MakerZIP } from '../src/MakerZIP';

describe('MakerZip', () => {
  let ensureDirectoryStub: SinonStub;
  let config: MakerZIPConfig;
  let maker: MakerZIP;
  let createMaker: () => void;

  const dir = path.resolve(__dirname, 'fixture', 'fake-app');
  const darwinDir = path.resolve(__dirname, 'fixture', 'fake-darwin-app');
  const makeDir = path.resolve(os.tmpdir(), 'forge-zip-test');
  const appName = 'My Test App';
  const targetArch = process.arch;
  const packageJSON = { version: '1.2.3' };
  let getStub: SinonStub;
  let isoString: SinonStub;

  beforeEach(() => {
    ensureDirectoryStub = stub().returns(Promise.resolve());
    config = {};

    createMaker = () => {
      maker = new MakerZIP(config);
      maker.ensureDirectory = ensureDirectoryStub;
      maker.prepareConfig(targetArch as ForgeArch);
    };
    createMaker();
    getStub = stub(got, 'get');
    isoString = stub(Date.prototype, 'toISOString');
  });

  afterEach(async () => {
    if (await fs.pathExists(makeDir)) {
      await fs.remove(makeDir);
    }
    got.get = getStub.wrappedMethod;
    Date.prototype.toISOString = isoString.wrappedMethod;
  });

  for (const platform of ['win32', 'linux']) {
    it(`should generate a zip file for a ${platform} app`, async () => {
      const output = await maker.make({
        dir,
        makeDir,
        appName,
        targetArch,
        targetPlatform: platform,
        packageJSON,
        forgeConfig: null as any,
      });

      expect(output).to.have.length(1, 'should have made a single file');
      expect(output[0]).to.match(/\.zip$/, 'should be a zip file');
      expect(await fs.pathExists(output[0])).to.equal(true, 'zip file should exist on disk');
    });
  }

  for (const platform of ['darwin', 'mas']) {
    it(`should generate a zip file for a ${platform} app`, async () => {
      const output = await maker.make({
        dir: darwinDir,
        makeDir,
        appName,
        targetArch,
        targetPlatform: platform,
        packageJSON,
        forgeConfig: null as any,
      });

      expect(output).to.have.length(1, 'should have made a single file');
      expect(output[0]).to.match(/\.zip$/, 'should be a zip file');
      expect(await fs.pathExists(output[0])).to.equal(true, 'zip file should exist on disk');
    });
  }

  describe('macUpdateManifestBaseUrl', () => {
    for (const platform of ['win32', 'linux', 'mas']) {
      it(`should not result in network calls on ${platform}`, async () => {
        const output = await maker.make({
          dir: darwinDir,
          makeDir,
          appName,
          targetArch,
          targetPlatform: platform,
          packageJSON,
          forgeConfig: null as any,
        });

        expect(output).to.have.length(1, 'should have made a single file');
        expect(getStub).to.not.have.been.called;
      });
    }

    describe('when making for the darwin platform', () => {
      it('should fetch the current RELEASES.json', async () => {
        maker.config = {
          macUpdateManifestBaseUrl: 'fake://test/foo',
        };
        getStub.returns(Promise.resolve({ statusCode: 200, body: '{}' }));
        await maker.make({
          dir: darwinDir,
          makeDir,
          appName,
          targetArch,
          targetPlatform: 'darwin',
          packageJSON,
          forgeConfig: null as any,
        });

        expect(getStub).to.have.been.calledOnce;
      });

      it('should generate a valid RELEASES.json manifest', async () => {
        maker.config = {
          macUpdateManifestBaseUrl: 'fake://test/foo',
        };
        getStub.returns(Promise.resolve({ statusCode: 200, body: '{}' }));
        const output = await maker.make({
          dir: darwinDir,
          makeDir,
          appName,
          targetArch,
          targetPlatform: 'darwin',
          packageJSON,
          forgeConfig: null as any,
        });

        const foo = await fs.readJson(output[1]);
        expect(foo).to.have.property('currentRelease', '1.2.3');
        expect(foo).to.have.property('releases');
        expect(foo.releases).to.be.an('array').with.lengthOf(1);
        expect(foo.releases[0]).to.have.property('version');
        expect(foo.releases[0]).to.have.property('updateTo');
        expect(foo.releases[0].updateTo).to.have.property('url');
      });

      it('should extend the current RELEASES.json manifest if it exists', async () => {
        maker.config = {
          macUpdateManifestBaseUrl: 'fake://test/foo',
          macUpdateReleaseNotes: 'my-notes',
        };
        const oneOneOneRelease = {
          version: '1.1.1',
          updateTo: {
            version: '1.1.1',
            name: 'Fun 1.1.1 Release',
            url: 'fake://test/bar',
          },
        };
        getStub.returns(
          Promise.resolve({
            statusCode: 200,
            body: JSON.stringify({
              currentRelease: '1.1.1',
              releases: [oneOneOneRelease],
            }),
          })
        );
        isoString.returns('fake-date');
        const output = await maker.make({
          dir: darwinDir,
          makeDir,
          appName,
          targetArch,
          targetPlatform: 'darwin',
          packageJSON,
          forgeConfig: null as any,
        });

        const foo = await fs.readJson(output[1]);
        expect(foo).to.have.property('currentRelease', '1.2.3');
        expect(foo).to.have.property('releases');
        expect(foo.releases).to.be.an('array').with.lengthOf(2);
        expect(foo.releases[0]).to.deep.equal(oneOneOneRelease);
        expect(foo.releases[1]).to.deep.equal({
          version: '1.2.3',
          updateTo: {
            version: '1.2.3',
            name: 'My Test App v1.2.3',
            url: 'fake://test/foo/fake-darwin-app-1.2.3.zip',
            notes: 'my-notes',
            pub_date: 'fake-date',
          },
        });
      });
    });
  });
});

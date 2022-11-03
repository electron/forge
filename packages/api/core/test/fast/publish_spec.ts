import os from 'os';
import path from 'path';

import { ForgeConfigPublisher, IForgePublisher } from '@electron-forge/shared-types';
import { expect } from 'chai';
import fs from 'fs-extra';
import proxyquire from 'proxyquire';
import { SinonStub, stub } from 'sinon';

import { PublishOptions } from '../../src/api';

async function loadFixtureConfig() {
  // eslint-disable-next-line node/no-missing-require
  return require('../../src/util/forge-config').default(path.resolve(__dirname, '../fixture/dummy_app'));
}

describe('publish', () => {
  let publish: (opts: PublishOptions) => Promise<void>;
  let makeStub: SinonStub;
  let resolveStub: SinonStub;
  let publisherSpy: SinonStub;
  let voidStub: SinonStub;
  let nowhereStub: SinonStub;
  let publishers: (SinonStub | ForgeConfigPublisher)[];
  let fooPublisher: { name: string; providedConfig: Record<string, unknown> };

  beforeEach(() => {
    resolveStub = stub();
    makeStub = stub();
    publisherSpy = stub();
    voidStub = stub();
    nowhereStub = stub();
    publishers = [{ name: '@electron-forge/publisher-test' }];
    const fakePublisher = (stub: SinonStub, name = 'default') =>
      class _FakePublisher {
        private publish: SinonStub;

        public name = name;

        constructor(public providedConfig: Record<string, unknown>) {
          fooPublisher = this;
          this.publish = stub;
        }
      };

    publish = proxyquire.noCallThru().load('../../src/api/publish', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      './make': {
        listrMake: async (...args: any[]) => {
          makeStub(...args);
        },
      },
      '../util/resolve-dir': async (dir: string) => resolveStub(dir),
      '../util/read-package-json': {
        readMutatedPackageJson: () => Promise.resolve(require('../fixture/dummy_app/package.json')),
      },
      '../util/forge-config': async () => {
        const config = await loadFixtureConfig();

        config.publishers = publishers;
        return config;
      },
      '../util/require-search': (_: string, [name]: [string]) => {
        if (name === 'void') {
          return fakePublisher(voidStub);
        }
        if (name === 'nowhere') {
          return fakePublisher(nowhereStub);
        }
        if (name === '@electron-forge/publisher-test') {
          return fakePublisher(publisherSpy);
        }
        if (name === '@electron-forge/publisher-foo') {
          return fakePublisher(publisherSpy, name);
        }
        return null;
      },
    }).default;

    publisherSpy.returns(Promise.resolve());
    resolveStub.returns(path.resolve(__dirname, '../fixture/dummy_app'));
  });

  it('should should call make', async () => {
    await publish({
      dir: __dirname,
      interactive: false,
    });
    expect(makeStub.callCount).to.equal(1);
  });

  it('should resolve publishers from the forge config if provided', async () => {
    publishers = [
      {
        name: 'bad',
        config: 'foo',
      },
      {
        name: '@electron-forge/publisher-foo',
        config: 'resolved',
      },
    ];
    await publish({
      dir: __dirname,
      interactive: false,
      publishTargets: ['@electron-forge/publisher-foo'],
    });
    expect(publisherSpy.callCount).to.equal(1);

    expect(fooPublisher.name).to.equal('@electron-forge/publisher-foo');
    expect(fooPublisher.providedConfig).to.equal('resolved');
  });

  it('should call the resolved publisher with the appropriate args', async () => {
    makeStub.onCall(0).callsArgWith(1, [{ artifacts: ['artifact1', 'artifact2'] }]);
    await publish({
      dir: __dirname,
      interactive: false,
    });
    expect(publisherSpy.callCount).to.equal(1);
    // pluginInterface will be a new instance so we ignore it
    delete publisherSpy.firstCall.args[0].forgeConfig.pluginInterface;
    delete publisherSpy.firstCall.args[0].setStatusLine;
    const testConfig = await loadFixtureConfig();

    testConfig.publishers = publishers;

    delete testConfig.pluginInterface;
    expect(publisherSpy.firstCall.args).to.deep.equal([
      {
        dir: resolveStub(),
        makeResults: [{ artifacts: ['artifact1', 'artifact2'] }],
        forgeConfig: testConfig,
      },
    ]);
  });

  it('should call the provided publisher with the appropriate args', async () => {
    makeStub.onCall(0).callsArgWith(1, [{ artifacts: ['artifact1', 'artifact2'] }]);
    await publish({
      dir: __dirname,
      interactive: false,
      // Fake instance of a publisher
      publishTargets: [
        {
          __isElectronForgePublisher: true,
          publish: publisherSpy,
          platforms: undefined,
        } as IForgePublisher,
      ],
    });
    expect(publisherSpy.callCount).to.equal(1);
    // pluginInterface will be a new instance so we ignore it
    delete publisherSpy.firstCall.args[0].forgeConfig.pluginInterface;
    delete publisherSpy.firstCall.args[0].setStatusLine;
    const testConfig = await loadFixtureConfig();

    testConfig.publishers = publishers;

    delete testConfig.pluginInterface;
    expect(publisherSpy.firstCall.args).to.deep.equal([
      {
        dir: resolveStub(),
        makeResults: [{ artifacts: ['artifact1', 'artifact2'] }],
        forgeConfig: testConfig,
      },
    ]);
  });

  it('should default to publishing nothing', async () => {
    publishers = [];
    await publish({
      dir: __dirname,
      interactive: false,
    });
    expect(publisherSpy.callCount).to.equal(0);
  });

  it('should resolve publishers when given a string name', async () => {
    expect(voidStub.callCount).to.equal(0);
    await publish({
      dir: __dirname,
      interactive: false,
      publishTargets: ['void'],
    });
    expect(voidStub.callCount).to.equal(1);
  });

  it('should resolve consecutive publishers when given an array of names', async () => {
    expect(voidStub.callCount).to.equal(0);
    expect(nowhereStub.callCount).to.equal(0);
    await publish({
      dir: __dirname,
      interactive: false,
      publishTargets: ['void', 'nowhere'],
    });
    expect(voidStub.callCount).to.equal(1);
    expect(nowhereStub.callCount).to.equal(1);
  });

  describe('dry run', () => {
    let dir: string;

    const fakeMake = (platform: string) => {
      const ret = [
        {
          artifacts: [path.resolve(dir, `out/make/artifact1-${platform}`), path.resolve(dir, `out/make/artifact2-${platform}`)],
        },
        {
          artifacts: [path.resolve(dir, `out/make/artifact3-${platform}`)],
        },
        {
          artifacts: [path.resolve(dir, `out/make/artifact4-${platform}`)],
        },
      ];
      const state = {
        platform,
        arch: 'x64',
        packageJSON: { state: platform === 'darwin' ? 1 : 0 },
      };
      Object.assign(ret[0], state);
      Object.assign(ret[1], state);
      Object.assign(ret[2], state);
      return ret;
    };

    before(async () => {
      dir = await fs.mkdtemp(path.resolve(os.tmpdir(), 'electron-forge-test-'));
    });

    beforeEach(() => {
      resolveStub.returns(dir);
    });

    describe('when creating a dry run', () => {
      beforeEach(async () => {
        makeStub.onCall(0).callsArgWith(1, fakeMake('darwin'));
        makeStub.onCall(1).callsArgWith(1, fakeMake('win32'));

        const dryPath = path.resolve(dir, 'out', 'publish-dry-run');
        await fs.mkdirs(dryPath);
        await fs.writeFile(path.resolve(dryPath, 'hash.json'), 'test');
        await publish({
          dir,
          interactive: false,
          dryRun: true,
        });
        expect(await fs.pathExists(path.resolve(dryPath, 'hash.json'))).to.equal(false, 'previous hashes should be erased');
        const backupDir = path.resolve(dir, 'out', 'backup');
        await fs.move(dryPath, backupDir);
        await publish({
          dir,
          interactive: false,
          dryRun: true,
        });
        for (const backedUp of await fs.readdir(backupDir)) {
          await fs.copy(path.resolve(backupDir, backedUp), path.resolve(dryPath, backedUp));
        }
      });

      it('should create dry run hash JSON files', async () => {
        expect(makeStub.callCount).to.equal(2);
        const dryRunFolder = path.resolve(dir, 'out', 'publish-dry-run');
        expect(await fs.pathExists(dryRunFolder)).to.equal(true);

        const hashFolders = await fs.readdir(dryRunFolder);
        expect(hashFolders).to.have.length(2, 'Should contain two hashes (two publishes)');
        for (const hashFolderName of hashFolders) {
          const hashFolder = path.resolve(dryRunFolder, hashFolderName);
          const makes = await fs.readdir(hashFolder);
          expect(makes).to.have.length(3, 'Should contain the results of three makes');
          for (const makeJson of makes) {
            const jsonPath = path.resolve(hashFolder, makeJson);
            const contents = await fs.readFile(jsonPath, 'utf8');
            expect(() => JSON.parse(contents), 'Should be valid JSON').to.not.throw();
            const data = JSON.parse(contents);
            expect(data).to.have.property('artifacts');
            expect(data).to.have.property('platform');
            expect(data).to.have.property('arch');
            expect(data).to.have.property('packageJSON');

            // Make the artifacts for later
            for (const artifactPath of data.artifacts) {
              await fs.mkdirp(path.dirname(path.resolve(dir, artifactPath)));
              await fs.writeFile(path.resolve(dir, artifactPath), artifactPath);
            }
          }
        }
      });
    });

    describe('when resuming a dry run', () => {
      beforeEach(async () => {
        await publish({
          dir,
          interactive: false,
          publishTargets: ['@electron-forge/publisher-test'],
          dryRunResume: true,
        });
      });

      it('should successfully restore values and pass them to publisher', () => {
        expect(makeStub.callCount).to.equal(0);
        expect(publisherSpy.callCount).to.equal(2, 'should call once for each platform (make run)');
        const darwinIndex = publisherSpy.firstCall.args[0].makeResults[0].artifacts.some((a: string) => a.includes('darwin')) ? 0 : 1;
        const win32Index = darwinIndex === 0 ? 1 : 0;
        const darwinArgs = publisherSpy.getCall(darwinIndex).args[0];
        const darwinArtifacts: unknown[] = [];
        for (const result of darwinArgs.makeResults) {
          darwinArtifacts.push(...result.artifacts);
        }
        expect(darwinArtifacts.sort()).to.deep.equal(
          fakeMake('darwin')
            .reduce((accum, val) => accum.concat(val.artifacts), [] as string[])
            .sort()
        );
        const win32Args = publisherSpy.getCall(win32Index).args[0];
        const win32Artifacts: unknown[] = [];
        for (const result of win32Args.makeResults) {
          win32Artifacts.push(...result.artifacts);
        }
        expect(win32Artifacts.sort()).to.deep.equal(
          fakeMake('win32')
            .reduce((accum, val) => accum.concat(val.artifacts), [] as string[])
            .sort()
        );
      });
    });

    after(async () => {
      await fs.remove(dir);
    });
  });
});

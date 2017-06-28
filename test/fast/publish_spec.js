import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

chai.use(chaiAsPromised);

describe('publish', () => {
  let publish;
  let makeStub;
  let requireSearchStub;
  let resolveStub;
  let publisherSpy;

  beforeEach(() => {
    requireSearchStub = sinon.stub();
    resolveStub = sinon.stub();
    makeStub = sinon.stub();
    publisherSpy = sinon.stub();

    publish = proxyquire.noCallThru().load('../../src/api/publish', {
      './make': async (...args) => makeStub(...args),
      '../util/resolve-dir': async dir => resolveStub(dir),
      '../util/read-package-json': () => Promise.resolve(require('../fixture/dummy_app/package.json')),
      '../util/forge-config': () => require('../../src/util/forge-config').default(path.resolve(__dirname, '../fixture/dummy_app')),
      '../util/require-search': requireSearchStub,
    }).default;

    publisherSpy.returns(Promise.resolve());
    requireSearchStub.returns(publisherSpy);
    resolveStub.returns(path.resolve(__dirname, '../fixture/dummy_app'));
    makeStub.returns([]);
  });

  it('should should call make with makeOptions', async () => {
    await publish({
      dir: __dirname,
      interactive: false,
    });
    expect(makeStub.callCount).to.equal(1);
  });

  it('should call the resolved publisher with the appropriate args', async () => {
    makeStub.returns([['artifact1', 'artifact2']]);
    await publish({
      dir: __dirname,
      interactive: false,
      authToken: 'my_token',
      tag: 'my_special_tag',
    });
    expect(publisherSpy.callCount).to.equal(1);
    expect(publisherSpy.firstCall.args).to.deep.equal([
      ['artifact1', 'artifact2'],
      require('../fixture/dummy_app/package.json'),
      await require('../../src/util/forge-config').default(path.resolve(__dirname, '../fixture/dummy_app')),
      'my_token',
      'my_special_tag',
      process.platform,
      process.arch,
    ]);
  });

  it('should default to publishing to github', async () => {
    await publish({
      dir: __dirname,
      interactive: false,
    });
    expect(requireSearchStub.firstCall.args[1][0]).to.equal('../publishers/github.js');
  });

  it('should resolve publishers when given a string name', async () => {
    await publish({
      dir: __dirname,
      interactive: false,
      publishTargets: ['void'],
    });
    expect(requireSearchStub.firstCall.args[1][0]).to.equal('../publishers/void.js');
  });

  it('should resolve consecutive publishers when given an array of names', async () => {
    await publish({
      dir: __dirname,
      interactive: false,
      publishTargets: ['void', 'nowhere', 'black_hole', 'everywhere'],
    });
    expect(requireSearchStub.getCall(0).args[1][0]).to.equal('../publishers/void.js');
    expect(requireSearchStub.getCall(1).args[1][0]).to.equal('../publishers/nowhere.js');
    expect(requireSearchStub.getCall(2).args[1][0]).to.equal('../publishers/black_hole.js');
    expect(requireSearchStub.getCall(3).args[1][0]).to.equal('../publishers/everywhere.js');
  });

  describe('dry run', () => {
    let dir;

    const fakeMake = (platform) => {
      const ret = [
        [
          path.resolve(dir, `artifact1-${platform}`),
          path.resolve(dir, `artifact2-${platform}`),
        ], [
          path.resolve(dir, `artifact3-${platform}`),
        ],
        [
          path.resolve(dir, `artifact4-${platform}`),
        ],
      ];
      const state = {
        platform,
        arch: 'x64',
        packageJSON: { state: 0 },
        forgeConfig: { config: 0 },
      };
      Object.assign(ret[0], state);
      Object.assign(ret[1], state);
      Object.assign(ret[2], state);
      return ret;
    };

    before(async () => {
      dir = await fs.mkdtemp(path.resolve(os.tmpdir(), 'electron-forge-test-'));
    });

    describe('when creating a dry run', () => {
      beforeEach(async () => {
        makeStub.returns(fakeMake('darwin'));
        const dryPath = path.resolve(dir, 'out', 'publish-dry-run');
        await fs.mkdirs(dryPath);
        await fs.writeFile(path.resolve(dryPath, 'hash.json'), 'test');
        await publish({
          dir,
          interactive: false,
          target: [],
          dryRun: true,
        });
        expect(await fs.exists(path.resolve(dryPath, 'hash.json'))).to.equal(false, 'previous hashes should be erased');
        const backupDir = path.resolve(dir, 'out', 'backup');
        await fs.move(dryPath, backupDir);
        makeStub.returns(fakeMake('win32'));
        await publish({
          dir,
          interactive: false,
          target: [],
          dryRun: true,
        });
        for (const backedUp of await fs.readdir(backupDir)) {
          await fs.copy(path.resolve(backupDir, backedUp), path.resolve(dryPath, backedUp));
        }
      });

      it('should create dry run hash JSON files', async () => {
        expect(makeStub.callCount).to.equal(2);
        const dryRunFolder = path.resolve(dir, 'out', 'publish-dry-run');
        expect(await fs.exists(dryRunFolder)).to.equal(true);

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
            expect(data).to.have.property('paths');
            expect(data).to.have.property('platform');
            expect(data).to.have.property('arch');
            expect(data).to.have.property('packageJSON');
            expect(data).to.have.property('forgeConfig');

            // Make the artifacts for later
            for (const artifactPath of data.paths) {
              await fs.writeFile(artifactPath, artifactPath);
            }
          }
        }
      });
    });

    describe('when resuming a dry run', () => {
      let publisher;

      beforeEach(async () => {
        publisher = sinon.stub();
        publisher.returns(Promise.resolve());
        requireSearchStub.returns(publisher);
        await publish({
          dir,
          interactive: false,
          target: [__filename],
          dryRunResume: true,
        });
      });

      it('should successfully restore values and pass them to publisher', () => {
        expect(makeStub.callCount).to.equal(0);
        expect(publisher.callCount).to.equal(2, 'should call once for each platform (make run)');
        const darwinIndex = publisher.firstCall.args[5] === 'darwin' ? 0 : 1;
        const win32Index = darwinIndex === 0 ? 1 : 0;
        expect(publisher.getCall(darwinIndex).args.slice(1)).to.deep.equal([
          { state: 0 },
          { config: 0 },
          undefined,
          null,
          'darwin',
          'x64',
        ]);
        expect(publisher.getCall(darwinIndex).args[0].sort()).to.deep.equal(
          fakeMake('darwin').reduce((accum, val) => accum.concat(val), []).sort()
        );
        expect(publisher.getCall(win32Index).args.slice(1)).to.deep.equal([
          { state: 0 },
          { config: 0 },
          undefined,
          null,
          'win32',
          'x64',
        ]);
        expect(publisher.getCall(win32Index).args[0].sort()).to.deep.equal(
          fakeMake('win32').reduce((accum, val) => accum.concat(val), []).sort()
        );
      });
    });

    after(async () => {
      await fs.remove(dir);
    });
  });
});

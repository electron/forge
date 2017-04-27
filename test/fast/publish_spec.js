import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
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
      target: 'void',
    });
    expect(requireSearchStub.firstCall.args[1][0]).to.equal('../publishers/void.js');
  });

  it('should resolve consecutive publishers when given an array of names', async () => {
    await publish({
      dir: __dirname,
      interactive: false,
      target: ['void', 'nowhere', 'black_hole', 'everywhere'],
    });
    expect(requireSearchStub.getCall(0).args[1][0]).to.equal('../publishers/void.js');
    expect(requireSearchStub.getCall(1).args[1][0]).to.equal('../publishers/nowhere.js');
    expect(requireSearchStub.getCall(2).args[1][0]).to.equal('../publishers/black_hole.js');
    expect(requireSearchStub.getCall(3).args[1][0]).to.equal('../publishers/everywhere.js');
  });
});

import { expect } from 'chai';
import sinon from 'sinon';
import once from '../src/util/once';

describe('Once', () => {
  it('triggers wrapped function', () => {
    const fakeA = sinon.fake();
    const fakeB = sinon.fake();
    const [wrappedA] = once(fakeA, fakeB);
    wrappedA();
    expect(fakeA.called).to.equal(true);
    expect(fakeB.called).to.equal(false);
  });

  it('triggers only once', () => {
    const fakeA = sinon.fake();
    const fakeB = sinon.fake();
    const [wrappedA, wrappedB] = once(fakeA, fakeB);
    wrappedA();
    wrappedB();
    expect(fakeA.called).to.equal(true);
    expect(fakeB.called).to.equal(false);
  });
});

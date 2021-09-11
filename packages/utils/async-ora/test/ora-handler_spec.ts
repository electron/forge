/* eslint "no-underscore-dangle": "off" */
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { asyncOra as ora, OraImpl } from '../src/index';

describe('asyncOra', () => {
  let asyncOra: typeof ora;
  let mockOra: (text: string) => OraImpl | undefined;
  let currentOra: OraImpl | undefined;

  beforeEach(() => {
    currentOra = undefined;
    mockOra = (text) => {
      currentOra = {
        failed: false,
        start() {
          this.started = true;
          return currentOra;
        },
        succeed() {
          this.succeeded = true;
          return currentOra;
        },
        fail() {
          this.failed = true;
          return currentOra;
        },
        stop() {
          this.failed = true;
          return currentOra;
        },
        get text() {
          return (currentOra! as any)._text;
        },
        set text(newText) {
          (currentOra! as any)._text = newText;
        },
      } as any;
      (currentOra as any).succeeded = false;
      (currentOra as any).failed = false;
      (currentOra as any)._text = text;
      return currentOra;
    };
    asyncOra = proxyquire.noCallThru().load('../src/ora-handler', {
      './ora': mockOra,
    }).default;
  });

  it('should create an ora with an initial value', () => {
    asyncOra('say this first', async () => { /* no-op async function */ });
    expect(currentOra).to.not.equal(undefined);
    expect(currentOra!.text).to.equal('say this first');
  });

  it('should not create an ora when in non-interactive mode', () => {
    asyncOra.interactive = false;
    asyncOra('say this again', async () => { /* no-op async function */ });
    expect(currentOra).to.equal(undefined);
  });

  it('should call the provided async function', async () => {
    const spy = sinon.spy();
    await asyncOra('random text', async () => {
      spy();
    });
    expect(spy.callCount).to.equal(1);
  });

  it('should succeed the ora if the async fn passes', async () => {
    await asyncOra('random text', async () => {
      // eslint-disable-next-line no-console, no-constant-condition
      if (2 + 2 === 5) console.error('Big brother is at it again');
    });
    expect((currentOra as any).succeeded).to.equal(true);
    expect((currentOra as any).failed).to.equal(false);
  });

  it('should fail the ora if the async fn throws', async () => {
    await asyncOra('this is gonna end badly', async () => {
      // eslint-disable-next-line no-throw-literal
      throw { message: 'Not an error', stack: 'No Stack - Not an error' };
    }, () => { /* no-op exit function */ });
    expect((currentOra as any).succeeded).to.equal(false);
    expect((currentOra as any).failed).to.equal(true);
  });

  it('should exit the process with status 1 if the async fn throws', async () => {
    const processExitSpy = sinon.spy();
    await asyncOra('this is dodge', async () => {
      throw new Error('woops');
    }, processExitSpy);
    expect(processExitSpy.callCount).to.equal(1);
    expect(processExitSpy.firstCall.args).to.deep.equal([1]);
  });

  it('should exit the process with status 1 if the async fn throws a number', async () => {
    const processExitSpy = sinon.spy();
    await asyncOra('this is dodge', async () => {
      throw 42; // eslint-disable-line no-throw-literal
    }, processExitSpy);
    expect(processExitSpy.callCount).to.equal(1);
    expect(processExitSpy.firstCall.args).to.deep.equal([1]);
  });

  it('should just reject the promise in non-interactive mode if the fn throws', (done) => {
    asyncOra.interactive = false;
    asyncOra('doo-wop', async () => {
      throw new Error('uh oh');
    }).then(() => done(new Error('expected asyncOra to be rejected')))
      .catch(() => done());
  });

  it('should provide a fully functioning mock ora in non-interactive mode', async () => {
    asyncOra.interactive = false;
    await asyncOra('ora-magic', async (spinner) => {
      expect(spinner).to.have.property('start');
      expect(spinner).to.have.property('stop');
      expect(spinner).to.have.property('succeed');
      expect(spinner).to.have.property('fail');
      expect(spinner.start().stop().fail().succeed()).to.equal(spinner);
    });
  });
});

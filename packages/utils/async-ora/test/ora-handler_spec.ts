/* eslint "no-underscore-dangle": "off" */
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { spy } from 'sinon';

import { asyncOra as ora, OraImpl } from '../src/index';

type MockOra = OraImpl & {
  _text: string;
  failed: boolean;
  started: boolean;
  succeeded: boolean;
};

describe('asyncOra', () => {
  let asyncOra: typeof ora;
  let mockOra: (text: string) => MockOra | undefined;
  let currentOra: MockOra | undefined;

  beforeEach(() => {
    currentOra = undefined;
    mockOra = (text) => {
      currentOra = {
        _text: '',
        failed: false,
        started: false,
        succeeded: false,
        warn() {
          return currentOra;
        },
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
        get text(): string {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return currentOra!._text;
        },
        set text(newText) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          currentOra!._text = newText;
        },
      } as MockOra;
      currentOra.succeeded = false;
      currentOra.failed = false;
      currentOra._text = text;
      return currentOra;
    };
    asyncOra = proxyquire.noCallThru().load('../src/ora-handler', {
      './ora': mockOra,
    }).default;
  });

  it('should create an ora with an initial value', () => {
    asyncOra('say this first', async () => {
      /* no-op async function */
    });
    expect(currentOra).to.not.equal(undefined);
    // Why: We checked for undefined in the line above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(currentOra!.text).to.equal('say this first');
  });

  it('should not create an ora when in non-interactive mode', () => {
    asyncOra.interactive = false;
    asyncOra('say this again', async () => {
      /* no-op async function */
    });
    expect(currentOra).to.equal(undefined);
  });

  it('should call the provided async function', async () => {
    const oraSpy = spy();
    await asyncOra('random text', async () => {
      oraSpy();
    });
    expect(oraSpy.callCount).to.equal(1);
  });

  it('should succeed the ora if the async fn passes', async () => {
    await asyncOra('random text', async () => {
      // eslint-disable-next-line no-console, no-constant-condition
      if (2 + 2 === 5) console.error('Big brother is at it again');
    });
    expect(currentOra).to.not.equal(undefined);
    // Why: We checked for undefined in the line above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(currentOra!.succeeded).to.equal(true);
    // Why: We checked for undefined in the line above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(currentOra!.failed).to.equal(false);
  });

  it('should fail the ora if the async fn throws', async () => {
    await asyncOra(
      'this is gonna end badly',
      async () => {
        // eslint-disable-next-line no-throw-literal
        throw { message: 'Not an error', stack: 'No Stack - Not an error' };
      },
      () => {
        /* no-op exit function */
      }
    );
    expect(currentOra).to.not.equal(undefined);
    // Why: We checked for undefined in the line above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(currentOra!.succeeded).to.equal(false);
    // Why: We checked for undefined in the line above
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(currentOra!.failed).to.equal(true);
  });

  it('should exit the process with status 1 if the async fn throws', async () => {
    const processExitSpy = spy();
    await asyncOra(
      'this is dodge',
      async () => {
        throw new Error('woops');
      },
      processExitSpy
    );
    expect(processExitSpy.callCount).to.equal(1);
    expect(processExitSpy.firstCall.args).to.deep.equal([1]);
  });

  it('should exit the process with status 1 if the async fn throws a number', async () => {
    const processExitSpy = spy();
    await asyncOra(
      'this is dodge',
      async () => {
        throw 42; // eslint-disable-line no-throw-literal
      },
      processExitSpy
    );
    expect(processExitSpy.callCount).to.equal(1);
    expect(processExitSpy.firstCall.args).to.deep.equal([1]);
  });

  it('should just reject the promise in non-interactive mode if the fn throws', async () => {
    asyncOra.interactive = false;
    expect(
      asyncOra('doo-wop', async () => {
        throw new Error('uh oh');
      })
    ).to.eventually.be.rejectedWith('uh oh');
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

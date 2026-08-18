import { afterEach, describe, expect, it, vi } from 'vitest';

import { requestAppRestart, setAppRestartHandler } from '../src/restart';

describe('requestAppRestart', () => {
  // The handler slot is process-wide, so every test has to give it back.
  const disposers: Array<() => void> = [];

  const register = (handler: () => boolean) => {
    const dispose = setAppRestartHandler(handler);
    disposers.push(dispose);
    return dispose;
  };

  afterEach(() => {
    while (disposers.length) disposers.pop()!();
  });

  it('reports failure when no handler is registered', () => {
    expect(requestAppRestart()).toBe(false);
  });

  it('delegates to the registered handler on every request', () => {
    const handler = vi.fn(() => true);
    register(handler);

    expect(requestAppRestart()).toBe(true);
    expect(requestAppRestart()).toBe(true);
    // Guards against `once` semantics: Vite rebuilds request a restart every time.
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('passes on a handler that could not honor the request', () => {
    register(() => false);

    expect(requestAppRestart()).toBe(false);
  });

  it('replaces the previously registered handler', () => {
    const stale = vi.fn(() => true);
    const current = vi.fn(() => true);
    register(stale);
    register(current);

    requestAppRestart();

    expect(stale).not.toHaveBeenCalled();
    expect(current).toHaveBeenCalledOnce();
  });

  it('reports a throwing handler as a failed restart rather than propagating', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    register(() => {
      throw new Error('kill failed');
    });

    // Callers are bundler hooks; a throw here would be reported to the user as
    // a build failure.
    expect(() => requestAppRestart()).not.toThrow();
    expect(requestAppRestart()).toBe(false);
    expect(consoleError).toHaveBeenCalled();
  });
});

describe('setAppRestartHandler', () => {
  it('returns a disposer that unregisters the handler', () => {
    const handler = vi.fn(() => true);
    const dispose = setAppRestartHandler(handler);

    dispose();

    expect(requestAppRestart()).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not let a stale disposer unregister a newer handler', () => {
    const stale = vi.fn(() => true);
    const current = vi.fn(() => true);
    const disposeStale = setAppRestartHandler(stale);
    const disposeCurrent = setAppRestartHandler(current);

    disposeStale();

    expect(requestAppRestart()).toBe(true);
    expect(current).toHaveBeenCalledOnce();

    disposeCurrent();
  });
});

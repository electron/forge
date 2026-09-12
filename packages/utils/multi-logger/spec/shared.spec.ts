import { Writable } from 'node:stream';

import { afterEach, describe, expect, it, vi } from 'vitest';

import Logger, {
  ensureSharedLogger,
  getSharedLogger,
  resetSharedLogger,
} from '../src/index';

const stdout = new Writable({
  write: (_chunk, _encoding, callback) => callback(),
}) as unknown as NodeJS.WriteStream;

afterEach(() => {
  getSharedLogger()?.stop();
  resetSharedLogger();
});

describe('shared logger', () => {
  it('has no logger until one is asked for', () => {
    expect(getSharedLogger()).toBeUndefined();
  });

  it('creates the logger once and hands out the same instance', () => {
    const logger = ensureSharedLogger({ stdout, title: 'First' });
    expect(logger).toBeInstanceOf(Logger);
    expect(getSharedLogger()).toBe(logger);
    expect(ensureSharedLogger()).toBe(logger);
    expect(ensureSharedLogger({ stdout, title: 'Second' })).toBe(logger);
  });

  it('is registered on globalThis so duplicate package copies share it', () => {
    const logger = ensureSharedLogger({ stdout });
    const slot = Symbol.for('@electron-forge/multi-logger');
    expect((globalThis as Record<symbol, unknown>)[slot]).toBe(logger);
  });

  it('merges only additive options into an existing logger', async () => {
    const restart = vi.fn();
    const first = ensureSharedLogger({
      stdout,
      forceMode: 'plain',
      keys: [{ key: 'r', label: 'restart', onPress: restart }],
    });
    const options = {
      title: 'Tool',
      initialTab: 'App',
      keys: [
        {
          key: 'r',
          label: 'a duplicate that must be ignored',
          onPress: vi.fn(),
        },
        { key: 'x', label: 'extra', onPress: vi.fn() },
      ],
      // Not additive: the mode was fixed when the logger was created.
      forceMode: 'ink' as const,
    };
    expect(ensureSharedLogger(options)).toBe(first);

    expect(first.mode).toBe('plain');
    // The caller's options object is left untouched.
    expect(options.keys).toHaveLength(2);

    // Only `title` is observable through the UI; check the merged keys via
    // extendOptions() on a fresh logger to keep this test free of ink.
    const probe = new Logger({
      stdout,
      forceMode: 'plain',
      keys: [{ key: 'r', label: 'restart', onPress: restart }],
    });
    probe.extendOptions(options);
    probe.extendOptions({ title: 'Ignored: already set', initialTab: 'Other' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((probe as any).options).toMatchObject({
      title: 'Tool',
      initialTab: 'App',
      keys: [
        { key: 'r', label: 'restart' },
        { key: 'x', label: 'extra' },
      ],
    });
    probe.stop();
    await first.start();
  });

  it('forgets the logger on reset without stopping it', () => {
    const logger = ensureSharedLogger({ stdout });
    const stop = vi.spyOn(logger, 'stop');
    resetSharedLogger();
    expect(getSharedLogger()).toBeUndefined();
    expect(stop).not.toHaveBeenCalled();
    expect(ensureSharedLogger({ stdout })).not.toBe(logger);
    logger.stop();
  });
});

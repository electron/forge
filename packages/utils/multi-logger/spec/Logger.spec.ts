import { spawn } from 'node:child_process';
import { Console } from 'node:console';
import { once } from 'node:events';
import { Writable } from 'node:stream';

import { afterEach, describe, expect, it, vi } from 'vitest';

import Logger from '../src/index';
import { FakeStdin } from './fakes';

class FakeStdout extends Writable {
  output = '';

  _write(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: () => void,
  ): void {
    this.output += chunk.toString();
    callback();
  }

  get lines(): string[] {
    return this.output.split('\n').filter((line) => line.length > 0);
  }
}

// ink patches the console via `new console.Console(...)`, which vitest's
// console replacement does not provide.
if (!('Console' in console)) Object.assign(console, { Console });

const loggers: Logger[] = [];

// The fake streams are not TTYs, so plain mode is picked and colors are off.
const makeLogger = (options = {}) => {
  const stdout = new FakeStdout();
  const logger = new Logger({
    stdout: stdout as unknown as NodeJS.WriteStream,
    stdin: process.stdin,
    ...options,
  });
  loggers.push(logger);
  return { logger, stdout };
};

afterEach(() => {
  for (const logger of loggers.splice(0)) logger.stop();
});

describe('Logger', () => {
  describe('mode selection', () => {
    it('falls back to plain output when the streams are not TTYs', () => {
      expect(makeLogger().logger.mode).toBe('plain');
    });

    it('honors forceMode and interactive', () => {
      expect(makeLogger({ forceMode: 'ink' }).logger.mode).toBe('ink');
      expect(makeLogger({ interactive: true }).logger.mode).toBe('ink');
      expect(
        makeLogger({ interactive: true, forceMode: 'plain' }).logger.mode,
      ).toBe('plain');
    });
  });

  describe('plain mode', () => {
    it('prefixes lines with a fixed-width tag and writes status lines', async () => {
      const { logger, stdout } = makeLogger();
      await logger.start();
      const main = logger.createTab('Main');
      const renderer = logger.createTab('Renderer (web)');

      main.log('compiling\nstill compiling');
      renderer.log('hello');
      renderer.setStatus({ state: 'success', durationMs: 1234 });
      main.setStatus({ state: 'error', errors: 2, durationMs: 50 });

      expect(stdout.lines).toEqual([
        '[Main]           compiling',
        '[Main]           still compiling',
        '[Renderer (web)] hello',
        '[Renderer (web)] ✔ compiled in 1.2s',
        '[Main]           ✖ failed with 2 errors in 50ms',
      ]);
    });

    it('replays everything buffered before start() in arrival order', async () => {
      const { logger, stdout } = makeLogger();
      const a = logger.createTab('A');
      const b = logger.createTab('B');
      a.log('a1');
      b.log('b1');
      a.log('a2\na3');
      b.setStatus({ state: 'building' });
      expect(stdout.output).toBe('');

      await logger.start();
      expect(stdout.lines).toEqual([
        '[A] a1',
        '[B] b1',
        '[A] a2',
        '[A] a3',
        '[B] ◌ building…',
      ]);

      a.log('a4');
      expect(stdout.lines.at(-1)).toBe('[A] a4');
    });

    it('flushes buffered lines when stopped without ever starting', () => {
      const { logger, stdout } = makeLogger();
      logger.createTab('Main').log('an error you must not lose');
      logger.stop();
      expect(stdout.lines).toEqual(['[Main] an error you must not lose']);

      // Idempotent: a second stop() writes nothing more.
      logger.stop();
      expect(stdout.lines).toHaveLength(1);
    });

    it('stops writing once stopped', async () => {
      const { logger, stdout } = makeLogger();
      const tab = logger.createTab('Main');
      await logger.start();
      logger.stop();
      tab.log('late');
      expect(stdout.output).toBe('');
    });

    it('does nothing when started after being stopped', async () => {
      const { logger, stdout } = makeLogger();
      logger.stop();
      await logger.start();
      logger.createTab('Main').log('ignored');
      expect(stdout.output).toBe('');
    });
  });

  describe('when the interactive UI fails to load', () => {
    it('falls back to plain output and reports the mode it ended up in', async () => {
      vi.doMock(import('../src/ink/render'), () => {
        throw new Error('ink is unavailable');
      });
      try {
        const { logger, stdout } = makeLogger({ forceMode: 'ink' });
        const tab = logger.createTab('Main');
        tab.log('buffered');
        expect(logger.mode).toBe('ink');

        await logger.start();
        expect(logger.mode).toBe('plain');
        tab.log('live');
        expect(stdout.lines).toEqual(['[Main] buffered', '[Main] live']);
      } finally {
        vi.doUnmock(import('../src/ink/render'));
      }
    });
  });

  describe('buffers', () => {
    it('keeps a merged view of all tabs bounded by maxLines', () => {
      const { logger } = makeLogger({ maxLines: 3 });
      const a = logger.createTab('A');
      const b = logger.createTab('B');
      a.log('1');
      b.log('2');
      a.log('3\n4');
      expect(
        logger.getMergedLines().map((l) => `${l.tab.name}${l.text}`),
      ).toEqual(['B2', 'A3', 'A4']);
      a.clear();
      expect(logger.getMergedLines().map((l) => l.text)).toEqual(['2']);
    });

    it('notifies subscribers until they unsubscribe', () => {
      const { logger } = makeLogger();
      const onLines = vi.fn();
      const unsubscribe = logger.subscribe({ onLines });
      const tab = logger.createTab('A');
      tab.log('x');
      expect(onLines).toHaveBeenCalledWith(tab, ['x']);
      unsubscribe();
      tab.log('y');
      expect(onLines).toHaveBeenCalledTimes(1);
    });
  });

  describe('attachProcess', () => {
    it('splits stdout and stderr into lines and marks the tab exited', async () => {
      const { logger } = makeLogger();
      const child = spawn(process.execPath, [
        '-e',
        [
          "process.stdout.write('partial');",
          "process.stdout.write(' line\\nsecond\\n');",
          "process.stderr.write('warning\\n');",
          "process.stdout.write('no trailing newline');",
          'process.exitCode = 3;',
        ].join(''),
      ]);
      const tab = logger.attachProcess(child, 'Electron');
      expect(tab.status).toEqual({ state: 'idle', detail: 'running' });

      await once(child, 'close');
      await vi.waitFor(() => expect(tab.status.state).toBe('exited'));
      expect(tab.status.detail).toBe('exited with code 3');
      expect(tab.getLines()).toContain('partial line');
      expect(tab.getLines()).toContain('second');
      expect(tab.getLines()).toContain('warning');
      expect(tab.getLines()).toContain('no trailing newline');
    });

    it('reuses a tab of the same name for a restarted process', async () => {
      const { logger } = makeLogger();
      const first = spawn(process.execPath, ['-e', "console.log('one')"]);
      const tab = logger.attachProcess(first);
      await once(first, 'close');

      const second = spawn(process.execPath, ['-e', "console.log('two')"]);
      expect(logger.attachProcess(second)).toBe(tab);
      await once(second, 'close');

      expect(tab.name).toBe('App');
      expect(logger.getTabs()).toHaveLength(1);
      expect(tab.getLines()).toEqual(['one', 'two']);
    });

    it('puts stdin back into raw mode when the process exits', async () => {
      const stdin = new FakeStdin();
      const setRawMode = vi.spyOn(stdin, 'setRawMode');
      const stdout = Object.assign(new FakeStdout(), {
        isTTY: true,
        columns: 80,
        rows: 24,
      });
      const { logger } = makeLogger({
        stdout: stdout as unknown as NodeJS.WriteStream,
        stdin: stdin as unknown as NodeJS.ReadStream,
        forceMode: 'ink',
      });
      await logger.start();
      // ink enables raw mode from an effect, so it lands a tick later.
      await vi.waitFor(() => expect(stdin.isRaw).toBe(true));
      setRawMode.mockClear();

      const child = spawn(process.execPath, ['-e', "console.log('one')"]);
      logger.attachProcess(child);
      await once(child, 'close');
      await vi.waitFor(() =>
        expect(setRawMode.mock.calls).toEqual([[false], [true]]),
      );
      expect(stdin.isRaw).toBe(true);
    });

    it('does not touch stdin in plain mode', async () => {
      const stdin = new FakeStdin();
      const setRawMode = vi.spyOn(stdin, 'setRawMode');
      const { logger } = makeLogger({
        stdin: stdin as unknown as NodeJS.ReadStream,
      });
      await logger.start();
      const child = spawn(process.execPath, ['-e', "console.log('one')"]);
      logger.attachProcess(child);
      await once(child, 'close');
      expect(setRawMode).not.toHaveBeenCalled();
    });
  });
});

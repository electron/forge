import { Writable } from 'node:stream';
import { stripVTControlCharacters } from 'node:util';

import Logger from '@electron-forge/multi-logger';
import { afterEach, describe, expect, it } from 'vitest';

import {
  buildTabName,
  createTabLogger,
  createUniqueTab,
  rendererTabName,
} from '../src/logging';

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

const loggers: Logger[] = [];

// The fake stream is not a TTY, so plain mode is picked and colors are off.
const makeLogger = () => {
  const stdout = new FakeStdout();
  const logger = new Logger({
    stdout: stdout as unknown as NodeJS.WriteStream,
    stdin: process.stdin,
  });
  loggers.push(logger);
  return { logger, stdout };
};

afterEach(() => {
  for (const logger of loggers.splice(0)) logger.stop();
});

describe('buildTabName', () => {
  it('names main targets after their entry', () => {
    expect(
      buildTabName({ entry: 'src/main.ts', config: 'vite.main.config.ts' }),
    ).toBe('Main (src/main.ts)');
    expect(
      buildTabName({
        entry: 'src/main.ts',
        config: 'vite.main.config.ts',
        target: 'main',
      }),
    ).toBe('Main (src/main.ts)');
  });

  it('names preload targets', () => {
    expect(
      buildTabName({
        entry: 'src/preload.ts',
        config: 'vite.preload.config.ts',
        target: 'preload',
      }),
    ).toBe('Preload (src/preload.ts)');
  });

  it('lists every entry of an array or object entry', () => {
    expect(
      buildTabName({ entry: ['src/a.ts', 'src/b.ts'], config: 'c.ts' }),
    ).toBe('Main (src/a.ts src/b.ts)');
    expect(
      buildTabName({
        entry: { worker: 'src/worker.ts', other: 'src/other.ts' },
        config: 'c.ts',
      }),
    ).toBe('Main (worker other)');
  });
});

describe('rendererTabName', () => {
  it('uses the last segment of the output directory', () => {
    expect(
      rendererTabName({ build: { outDir: '.vite/renderer/main_window' } }),
    ).toBe('Renderer (main_window)');
  });

  it('falls back when there is no output directory', () => {
    expect(rendererTabName({})).toBe('Renderer (renderer)');
    expect(rendererTabName({ build: { outDir: '' } })).toBe(
      'Renderer (renderer)',
    );
  });
});

describe('createUniqueTab', () => {
  it('numbers repeated names', () => {
    const { logger } = makeLogger();
    expect(createUniqueTab(logger, 'Main (src/main.ts)').name).toBe(
      'Main (src/main.ts)',
    );
    expect(createUniqueTab(logger, 'Main (src/main.ts)').name).toBe(
      'Main (src/main.ts) #2',
    );
    expect(createUniqueTab(logger, 'Main (src/main.ts)').name).toBe(
      'Main (src/main.ts) #3',
    );
    expect(createUniqueTab(logger, 'Preload (src/preload.ts)').name).toBe(
      'Preload (src/preload.ts)',
    );
    expect(logger.getTabs().map((tab) => tab.name)).toEqual([
      'Main (src/main.ts)',
      'Main (src/main.ts) #2',
      'Main (src/main.ts) #3',
      'Preload (src/preload.ts)',
    ]);
  });
});

describe('createTabLogger', () => {
  it('writes messages into the tab', async () => {
    const { logger, stdout } = makeLogger();
    await logger.start();
    const tab = logger.createTab('Renderer (main_window)');
    const viteLogger = createTabLogger(tab);

    viteLogger.info('  ➜  Local:   http://localhost:5173/');
    viteLogger.warn('something looks off');
    viteLogger.error('boom');

    expect(tab.getLines()).toEqual([
      '  ➜  Local:   http://localhost:5173/',
      'something looks off',
      'boom',
    ]);
    expect(stripVTControlCharacters(stdout.lines[0])).toBe(
      '[Renderer (main_window)]   ➜  Local:   http://localhost:5173/',
    );
  });

  it('formats timestamped messages the way Vite does', () => {
    const { logger } = makeLogger();
    const tab = logger.createTab('Renderer (main_window)');
    const viteLogger = createTabLogger(tab);

    viteLogger.info('hmr update /src/renderer.ts', {
      timestamp: true,
      environment: '(client)',
    });

    expect(tab.getLines()).toHaveLength(1);
    // <time> [vite] (client) hmr update /src/renderer.ts, colored when the
    // terminal supports it (e.g. FORCE_COLOR on CI), so compare without ANSI.
    expect(stripVTControlCharacters(tab.getLines()[0])).toMatch(
      /^\S+(?: [AP]M)? \[vite\] \(client\) hmr update \/src\/renderer\.ts$/,
    );
  });

  it('tracks warnings and errors in the tab status', () => {
    const { logger } = makeLogger();
    const tab = logger.createTab('Renderer (main_window)');
    const viteLogger = createTabLogger(tab);
    tab.setStatus({ state: 'success' });

    viteLogger.warn('one');
    expect(tab.status).toEqual({ state: 'warning', warnings: 1 });
    expect(viteLogger.hasWarned).toBe(true);
    viteLogger.warn('two');
    expect(tab.status).toEqual({ state: 'warning', warnings: 2 });

    viteLogger.error('broken');
    expect(tab.status).toEqual({ state: 'error', errors: 1 });
    viteLogger.error('still broken');
    expect(tab.status).toEqual({ state: 'error', errors: 2 });

    // A warning must not hide an error.
    viteLogger.warn('three');
    expect(tab.status).toEqual({ state: 'error', errors: 2 });
  });

  it('returns to success when Vite starts a fresh cycle', () => {
    const { logger } = makeLogger();
    const tab = logger.createTab('Renderer (main_window)');
    const viteLogger = createTabLogger(tab);

    viteLogger.error('Failed to resolve import', { timestamp: true });
    expect(tab.status.state).toBe('error');

    // Not a fresh cycle: a plain info line keeps the error visible.
    viteLogger.info('  ➜  press h + enter to show help');
    expect(tab.status.state).toBe('error');

    viteLogger.info('hmr update /src/renderer.ts', {
      clear: true,
      timestamp: true,
    });
    expect(tab.status).toEqual({ state: 'success' });
  });

  it('honors the configured log level', () => {
    const { logger } = makeLogger();
    const tab = logger.createTab('Renderer (main_window)');
    const viteLogger = createTabLogger(tab, 'warn');

    viteLogger.info('dropped');
    viteLogger.warn('kept');
    viteLogger.error('kept too');
    expect(tab.getLines()).toEqual(['kept', 'kept too']);

    const silent = createTabLogger(logger.createTab('Quiet'), 'silent');
    silent.error('dropped');
    expect(logger.getTab('Quiet')?.getLines()).toEqual([]);
  });

  it('only warns once per message and remembers logged errors', () => {
    const { logger } = makeLogger();
    const tab = logger.createTab('Renderer (main_window)');
    const viteLogger = createTabLogger(tab);

    viteLogger.warnOnce('same');
    viteLogger.warnOnce('same');
    viteLogger.warnOnce('different');
    expect(tab.getLines()).toEqual(['same', 'different']);
    expect(tab.status).toEqual({ state: 'warning', warnings: 2 });

    const error = new Error('transform failed');
    expect(viteLogger.hasErrorLogged(error)).toBe(false);
    viteLogger.error(error.message, { error });
    expect(viteLogger.hasErrorLogged(error)).toBe(true);
    expect(viteLogger.hasErrorLogged(new Error('other'))).toBe(false);

    // Nothing to clear, but Vite calls it.
    expect(() => viteLogger.clearScreen('info')).not.toThrow();
    expect(tab.getLines()).toHaveLength(3);
  });
});

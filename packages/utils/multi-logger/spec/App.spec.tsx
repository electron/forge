import { Writable } from 'node:stream';

import { render as inkRender } from 'ink';
import { render } from 'ink-testing-library';
import stringWidth from 'string-width';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App, AppProps } from '../src/ink/App';
import Logger from '../src/Logger';
import { FakeStdin, FakeStdout } from './fakes';

const loggers: Logger[] = [];

const makeLogger = () => {
  // Rendering is driven by ink-testing-library; the logger itself stays plain
  // and writes into the void.
  const logger = new Logger({
    stdout: new Writable({
      write: (_chunk, _encoding, callback) => callback(),
    }) as unknown as NodeJS.WriteStream,
    forceMode: 'plain',
  });
  loggers.push(logger);
  return logger;
};

const instances: { unmount(): void }[] = [];

/**
 * Like ink-testing-library's `render`, but at a chosen terminal size.
 */
const renderAt = (
  columns: number,
  rows: number,
  props: Omit<AppProps, 'keys' | 'onQuit'> & Partial<AppProps>,
) => {
  const stdout = new FakeStdout(columns, rows);
  const stdin = new FakeStdin();
  const instance = inkRender(
    <App keys={[]} onQuit={() => undefined} {...props} />,
    {
      stdout: stdout as unknown as NodeJS.WriteStream,
      stdin: stdin as unknown as NodeJS.ReadStream,
      stderr: new FakeStdout(columns, rows) as unknown as NodeJS.WriteStream,
      debug: true,
      exitOnCtrlC: false,
      patchConsole: false,
    },
  );
  instances.push(instance);
  const lines = () => lastFrame().split('\n');
  const lastFrame = () => stdout.lastFrame() ?? '';
  return { stdin, lastFrame, lines };
};

/**
 * Four tabs plus a title: at 120 columns the full tab bar (with durations)
 * is 129 columns wide, so something has to give.
 */
const makeWebpackLikeLogger = () => {
  const logger = makeLogger();
  const main = logger.createTab('Main Process');
  const preload = logger.createTab('Preload (web)');
  const renderer = logger.createTab('Renderer (web)');
  const app = logger.createTab('App');
  main.log('main line');
  main.setStatus({ state: 'success', durationMs: 1234 });
  preload.setStatus({ state: 'success', durationMs: 400 });
  renderer.setStatus({ state: 'success', durationMs: 900 });
  app.log('app line');
  app.setStatus({ state: 'idle', detail: 'running' });
  return logger;
};

const TITLE = 'Electron Forge · webpack';

afterEach(() => {
  for (const instance of instances.splice(0)) instance.unmount();
  for (const logger of loggers.splice(0)) logger.stop();
});

const ESC = String.fromCharCode(0x1b);
const ARROW_RIGHT = `${ESC}[C`;
const ARROW_UP = `${ESC}[A`;
const CTRL_C = String.fromCharCode(0x03);

describe('App', () => {
  it('shows a placeholder before any tab exists', () => {
    const { lastFrame } = render(
      <App logger={makeLogger()} keys={[]} onQuit={() => undefined} />,
    );
    expect(lastFrame()).toContain('Waiting for output…');
  });

  it('renders tabs with their status and the active tab body', () => {
    const logger = makeLogger();
    const main = logger.createTab('Main Process');
    const renderer = logger.createTab('Renderer (web)');
    main.log('main line 1\nmain line 2');
    main.setStatus({ state: 'success', durationMs: 1200 });
    renderer.log('renderer line');
    renderer.setStatus({ state: 'error', errors: 2 });

    const { lastFrame } = render(
      <App
        logger={logger}
        title="Forge"
        keys={[{ key: 'r', label: 'restart electron', onPress: vi.fn() }]}
        onQuit={() => undefined}
      />,
    );

    const frame = lastFrame()!;
    expect(frame).toContain('Forge');
    expect(frame).toContain('1 Main Process ✔ 1.2s');
    expect(frame).toContain('2 Renderer (web) ✖ 2');
    expect(frame).toContain('a All');
    expect(frame).toContain('main line 1');
    expect(frame).toContain('main line 2');
    expect(frame).not.toContain('renderer line');
    expect(frame).toContain('r restart electron');
    expect(frame).toContain('q quit');
  });

  it('switches tabs with digits, arrows and the merged view', async () => {
    const logger = makeLogger();
    logger.createTab('Main Process').log('main line');
    logger.createTab('Renderer (web)').log('renderer line');

    const { lastFrame, stdin } = render(
      <App logger={logger} keys={[]} onQuit={() => undefined} />,
    );

    stdin.write('2');
    await vi.waitFor(() => expect(lastFrame()).toContain('renderer line'));
    expect(lastFrame()).not.toContain('main line');

    stdin.write(ARROW_RIGHT);
    await vi.waitFor(() =>
      expect(lastFrame()).toContain('[Main Process] main line'),
    );
    expect(lastFrame()).toContain('[Renderer (web)] renderer line');

    stdin.write('1');
    await vi.waitFor(() => expect(lastFrame()).toContain('main line'));
    expect(lastFrame()).not.toContain('renderer line');
  });

  it('re-renders as new lines arrive and scrolls back through them', async () => {
    const logger = makeLogger();
    const tab = logger.createTab('Main Process');
    const { lastFrame, stdin } = render(
      <App logger={logger} keys={[]} onQuit={() => undefined} />,
    );

    // The fake terminal is 24 rows tall, so 40 lines overflow the body.
    tab.log(Array.from({ length: 40 }, (_, i) => `line ${i}`).join('\n'));
    await vi.waitFor(() => expect(lastFrame()).toContain('line 39'));
    expect(lastFrame()).not.toContain('line 0\n');

    stdin.write(ARROW_UP);
    await vi.waitFor(() => expect(lastFrame()).toContain('scrolled ↑ 1 lines'));
    expect(lastFrame()).not.toContain('line 39');
    expect(lastFrame()).toContain('line 38');

    stdin.write('f');
    await vi.waitFor(() => expect(lastFrame()).toContain('line 39'));
    expect(lastFrame()).not.toContain('scrolled');
  });

  describe('tab bar', () => {
    it('drops the durations so every chip fits at 120 columns', () => {
      const { lines } = renderAt(120, 36, {
        logger: makeWebpackLikeLogger(),
        title: TITLE,
      });
      const [header, divider] = lines();
      expect(stringWidth(header)).toBeLessThanOrEqual(120);
      expect(header).toContain(TITLE);
      expect(header).toContain('1 Main Process ✔');
      expect(header).toContain('4 App ●');
      expect(header).toContain('a All');
      expect(header).not.toContain('…');
      expect(header).not.toContain('1.2s');
      expect(divider).toBe('─'.repeat(120));
      expect(lines()).toHaveLength(36);
    });

    it('keeps the chips (with All highlighted) in the merged view', async () => {
      const { stdin, lines, lastFrame } = renderAt(120, 36, {
        logger: makeWebpackLikeLogger(),
        title: TITLE,
      });
      stdin.write('a');
      await vi.waitFor(() =>
        expect(lastFrame()).toContain('[Main Process] main line'),
      );
      const [header] = lines();
      expect(header).toContain('1 Main Process ✔');
      expect(header).toContain('4 App ●');
      expect(header).toContain('a All');
      expect(header).not.toContain('…');
      // The merged view carries `[Tab] ` prefixes; the body must still fit.
      expect(lines()).toHaveLength(36);
      expect(lines().at(-1)).toContain('q quit');
    });

    it('wraps onto more rows when even the compact chips do not fit', () => {
      const { lines } = renderAt(60, 24, {
        logger: makeWebpackLikeLogger(),
        title: TITLE,
      });
      const frame = lines();
      expect(frame).toHaveLength(24);
      expect(frame[0]).not.toContain(TITLE);
      expect(frame[0]).toContain('1 Main Process ✔');
      expect(frame[0]).toContain('3 Renderer (web) ✔');
      expect(frame[1]).toContain('4 App ●');
      expect(frame[1]).toContain('a All');
      expect(frame[2]).toBe('─'.repeat(60));
      for (const row of frame) expect(stringWidth(row)).toBeLessThanOrEqual(60);
      expect(frame.at(-2)).toBe('main line');
      expect(frame.at(-1)).toContain('←/→ 1-9 tabs');
    });

    it('shows the durations again when there is room', () => {
      const { lines } = renderAt(200, 36, {
        logger: makeWebpackLikeLogger(),
        title: TITLE,
      });
      expect(lines()[0]).toContain('1 Main Process ✔ 1.2s');
      expect(lines()[0]).toContain('4 App ● running');
      expect(lines()[0]).toContain('a All');
    });

    it('never gets squeezed by body lines that wrap', () => {
      const logger = makeLogger();
      const tab = logger.createTab('Main Process');
      tab.log(
        Array.from({ length: 40 }, (_, i) => `${i}`.padEnd(300, 'x')).join(
          '\n',
        ),
      );
      const { lines } = renderAt(80, 24, { logger, title: TITLE });
      const frame = lines();
      expect(frame).toHaveLength(24);
      expect(frame[0]).toContain(TITLE);
      expect(frame[0]).toContain('1 Main Process');
      expect(frame[1]).toBe('─'.repeat(80));
      expect(frame.at(-1)).toContain('q quit');
      // 300 columns wrap to 4 rows each, so 5 whole lines fit in 21 rows.
      expect(frame.join('\n')).toContain('39xxx');
      expect(frame.join('\n')).toContain('35xxx');
      expect(frame.join('\n')).not.toContain('34xxx');
    });
  });

  describe('initialTab', () => {
    it('starts on the named tab, falling back to the first', () => {
      const logger = makeWebpackLikeLogger();
      expect(
        renderAt(120, 24, { logger, initialTab: 'App' }).lastFrame(),
      ).toContain('app line');
      expect(
        renderAt(120, 24, { logger, initialTab: 'Nope' }).lastFrame(),
      ).toContain('main line');
      expect(
        renderAt(120, 24, { logger, initialTab: 'all' }).lastFrame(),
      ).toContain('[App] app line');
    });
  });

  describe('error auto-switch', () => {
    it('switches to a failing tab at most once per debounce window', async () => {
      const logger = makeLogger();
      const main = logger.createTab('Main Process');
      const renderer = logger.createTab('Renderer (web)');
      const preload = logger.createTab('Preload (web)');
      main.log('main line');
      renderer.log('renderer line');
      preload.log('preload line');
      const { lastFrame } = renderAt(120, 24, {
        logger,
        errorSwitchDebounceMs: 300,
      });
      expect(lastFrame()).toContain('main line');

      renderer.setStatus({ state: 'error', errors: 1 });
      await vi.waitFor(() => expect(lastFrame()).toContain('renderer line'));

      // A second failure inside the window does not steal the view, and a
      // tab that stays in error does not re-trigger either.
      preload.setStatus({ state: 'error', errors: 1 });
      renderer.setStatus({ state: 'error', errors: 2 });
      await vi.waitFor(() => expect(lastFrame()).toContain('✖ 2'));
      expect(lastFrame()).toContain('renderer line');
      expect(lastFrame()).not.toContain('preload line');

      await new Promise((resolve) => setTimeout(resolve, 350));
      preload.setStatus({ state: 'success' });
      preload.setStatus({ state: 'error', errors: 1 });
      await vi.waitFor(() => expect(lastFrame()).toContain('preload line'));
    });
  });

  it('runs custom keys, clears tabs and quits on q or Ctrl+C', async () => {
    const logger = makeLogger();
    const tab = logger.createTab('Main Process');
    tab.log('something');
    const onPress = vi.fn();
    const onQuit = vi.fn();
    const { lastFrame, stdin } = render(
      <App
        logger={logger}
        keys={[{ key: 'r', label: 'restart', onPress }]}
        onQuit={onQuit}
      />,
    );

    stdin.write('r');
    expect(onPress).toHaveBeenCalledOnce();

    stdin.write('c');
    await vi.waitFor(() => expect(lastFrame()).not.toContain('something'));
    expect(tab.lineCount).toBe(0);

    stdin.write('q');
    expect(onQuit).toHaveBeenCalledTimes(1);
    stdin.write(CTRL_C);
    expect(onQuit).toHaveBeenCalledTimes(2);
  });
});

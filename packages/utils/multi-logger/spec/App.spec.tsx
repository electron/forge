import { Writable } from 'node:stream';

import { render } from 'ink-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '../src/ink/App';
import Logger from '../src/Logger';

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

afterEach(() => {
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

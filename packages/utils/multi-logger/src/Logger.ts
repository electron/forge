import { ChildProcess } from 'node:child_process';
import { Readable } from 'node:stream';

import debug from 'debug';

import { TAG_COLORS } from './format.js';
import PlainRenderer from './plain.js';
import Tab from './Tab.js';
import { LoggerMode, LoggerOptions } from './types.js';

const d = debug('electron-forge:multi-logger');

const DEFAULT_MAX_LINES = 5000;

export interface MergedLine {
  tab: Tab;
  text: string;
}

export interface LoggerListener {
  onTab?(tab: Tab): void;
  onLines?(tab: Tab, lines: string[]): void;
  onStatus?(tab: Tab): void;
  onClear?(tab: Tab): void;
}

interface Renderer {
  stop(): void;
}

/**
 * Collects multiple named streams of log lines ("tabs") and renders them in
 * the terminal: as an interactive tabbed UI when attached to a TTY, or as
 * tag-prefixed lines otherwise. Everything logged before {@link Logger.start}
 * is buffered, so tabs can be created and written to early.
 */
export default class Logger {
  private readonly tabs: Tab[] = [];

  private readonly merged: MergedLine[] = [];

  private readonly listeners = new Set<LoggerListener>();

  private readonly maxLines: number;

  private readonly stdout: NodeJS.WriteStream;

  private readonly stdin: NodeJS.ReadStream;

  readonly mode: LoggerMode;

  private renderer: Renderer | null = null;

  private started = false;

  private stopped = false;

  constructor(private readonly options: LoggerOptions = {}) {
    this.maxLines = options.maxLines ?? DEFAULT_MAX_LINES;
    this.stdout = options.stdout ?? process.stdout;
    this.stdin = options.stdin ?? process.stdin;

    const interactive =
      options.interactive ??
      (Boolean(this.stdout.isTTY) &&
        Boolean(this.stdin.isTTY) &&
        !process.env.CI);
    this.mode = options.forceMode ?? (interactive ? 'ink' : 'plain');

    // Make sure a crash never leaves the terminal in the alternate screen.
    process.on('exit', this.onProcessExit);
  }

  private onProcessExit = () => this.stop();

  getTabs(): readonly Tab[] {
    return this.tabs;
  }

  getTab(name: string): Tab | undefined {
    return this.tabs.find((tab) => tab.name === name);
  }

  /**
   * Every line from every tab, in arrival order.
   */
  getMergedLines(): readonly MergedLine[] {
    return this.merged;
  }

  /**
   * Creates a new tab. The name is shown in the tab bar (and as the tag in
   * plain mode) so it should be short and human readable.
   */
  createTab(name: string): Tab {
    const tab = new Tab(
      name,
      TAG_COLORS[this.tabs.length % TAG_COLORS.length],
      this.maxLines,
      {
        onLines: (tab, lines) => {
          for (const text of lines) this.merged.push({ tab, text });
          if (this.merged.length > this.maxLines) {
            this.merged.splice(0, this.merged.length - this.maxLines);
          }
          this.emit('onLines', tab, lines);
        },
        onStatus: (tab) => this.emit('onStatus', tab),
        onClear: (tab) => {
          for (let i = this.merged.length - 1; i >= 0; i--) {
            if (this.merged[i].tab === tab) this.merged.splice(i, 1);
          }
          this.emit('onClear', tab);
        },
      },
    );
    this.tabs.push(tab);
    this.emit('onTab', tab);
    return tab;
  }

  /**
   * Pipes a child process's stdout and stderr into a tab, line by line, and
   * marks the tab as exited when the process ends. A tab with the same name is
   * reused, so a restarted process keeps writing to the same tab.
   */
  attachProcess(child: ChildProcess, name = 'Electron'): Tab {
    const tab = this.getTab(name) ?? this.createTab(name);
    tab.setStatus({ state: 'idle', detail: 'running' });

    const pipe = (stream: Readable | null) => {
      if (!stream) return;
      let pending = '';
      stream.setEncoding('utf8');
      stream.on('data', (chunk: string) => {
        const lines = (pending + chunk).split('\n');
        pending = lines.pop() ?? '';
        if (lines.length > 0) tab.log(lines.join('\n'));
      });
      stream.on('end', () => {
        if (pending) tab.log(pending);
        pending = '';
      });
    };
    pipe(child.stdout);
    pipe(child.stderr);

    child.once('exit', (code, signal) => {
      tab.setStatus({
        state: 'exited',
        detail: signal ? `exited (${signal})` : `exited with code ${code}`,
      });
    });
    return tab;
  }

  subscribe(listener: LoggerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit<E extends keyof LoggerListener>(
    event: E,
    ...args: Parameters<NonNullable<LoggerListener[E]>>
  ): void {
    for (const listener of this.listeners) {
      (listener[event] as ((...a: typeof args) => void) | undefined)?.(...args);
    }
  }

  /**
   * Starts rendering. Lines logged before this point are shown too.
   */
  async start(): Promise<void> {
    if (this.started || this.stopped) return;
    this.started = true;

    if (this.mode === 'ink') {
      try {
        const { startInk } = await import('./ink/render.js');
        if (this.stopped) return;
        this.renderer = startInk({
          logger: this,
          stdout: this.stdout,
          stdin: this.stdin,
          title: this.options.title,
          keys: this.options.keys ?? [],
          onQuit: () => this.quit(),
        });
        return;
      } catch (err) {
        d(
          'failed to start the interactive UI, falling back to plain output',
          err,
        );
      }
    }

    const plain = new PlainRenderer(this, this.stdout);
    plain.start();
    this.renderer = plain;
  }

  /**
   * Stops rendering and restores the terminal. If the interactive UI was never
   * shown (for example because startup failed) the buffered lines are written
   * out as plain text instead, so nothing is lost. Safe to call repeatedly.
   */
  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    process.off('exit', this.onProcessExit);

    if (this.renderer) {
      this.renderer.stop();
    } else {
      new PlainRenderer(this, this.stdout).replay();
    }
  }

  /**
   * Tears down the UI and re-raises SIGINT so the surrounding process shuts
   * down exactly as if the user had pressed Ctrl+C without the UI in raw mode.
   */
  private quit(): void {
    this.stop();
    if (process.listenerCount('SIGINT') > 0) {
      process.emit('SIGINT', 'SIGINT');
    } else {
      process.kill(process.pid, 'SIGINT');
    }
  }
}

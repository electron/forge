import { TagColor } from './format.js';
import { splitLines } from './lines.js';
import { TabStatus } from './types.js';

export interface TabListener {
  onLines(tab: Tab, lines: string[]): void;
  onStatus(tab: Tab): void;
  onClear(tab: Tab): void;
}

/**
 * One named stream of log lines. Tabs are created via `Logger#createTab`.
 */
export default class Tab {
  private lines: string[] = [];

  private _status: TabStatus = { state: 'idle' };

  constructor(
    readonly name: string,
    readonly color: TagColor,
    private readonly maxLines: number,
    private readonly listener: TabListener,
  ) {}

  get status(): TabStatus {
    return this._status;
  }

  get lineCount(): number {
    return this.lines.length;
  }

  getLines(): readonly string[] {
    return this.lines;
  }

  /**
   * Appends text to the tab. The text may span many lines and contain ANSI
   * styling; it is split into lines internally.
   */
  log(text: string): void {
    const lines = splitLines(text);
    if (lines.length === 0) return;

    for (const line of lines.slice(-this.maxLines)) {
      this.lines.push(line);
    }
    if (this.lines.length > this.maxLines) {
      this.lines.splice(0, this.lines.length - this.maxLines);
    }
    this.listener.onLines(this, lines);
  }

  setStatus(status: TabStatus): void {
    this._status = status;
    this.listener.onStatus(this);
  }

  clear(): void {
    this.lines = [];
    this.listener.onClear(this);
  }
}

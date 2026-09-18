import { styleText } from 'node:util';

import { describeStatus } from './format.js';
import Logger from './Logger.js';
import Tab from './Tab.js';

/**
 * Append-only renderer for non-interactive terminals and CI: every line is
 * prefixed with a colored, fixed-width `[Tab Name]` tag and status changes are
 * written as single lines.
 */
export default class PlainRenderer {
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly logger: Logger,
    private readonly stdout: NodeJS.WritableStream,
  ) {}

  private style(format: Parameters<typeof styleText>[0], text: string) {
    return styleText(format, text, { stream: this.stdout });
  }

  private tag(tab: Tab): string {
    const width = Math.max(
      ...this.logger.getTabs().map((t) => t.name.length + 2),
    );
    return this.style(tab.color, `[${tab.name}]`.padEnd(width));
  }

  private writeLines(tab: Tab, lines: readonly string[]): void {
    if (lines.length === 0) return;
    const tag = this.tag(tab);
    this.stdout.write(lines.map((line) => `${tag} ${line}\n`).join(''));
  }

  private writeStatus(tab: Tab): void {
    const { glyph, color, text } = describeStatus(tab.status);
    this.stdout.write(
      `${this.tag(tab)} ${this.style(color, glyph)} ${this.style('dim', text)}\n`,
    );
  }

  /**
   * Writes everything logged so far, in arrival order.
   */
  replay(): void {
    // Group consecutive lines from the same tab into one write.
    const merged = this.logger.getMergedLines();
    let from = 0;
    for (let i = 1; i <= merged.length; i++) {
      if (i === merged.length || merged[i].tab !== merged[from].tab) {
        this.writeLines(
          merged[from].tab,
          merged.slice(from, i).map((line) => line.text),
        );
        from = i;
      }
    }
  }

  start(): void {
    this.replay();
    for (const tab of this.logger.getTabs()) {
      if (tab.status.state !== 'idle') this.writeStatus(tab);
    }
    this.unsubscribe = this.logger.subscribe({
      onLines: (tab, lines) => this.writeLines(tab, lines),
      onStatus: (tab) => this.writeStatus(tab),
    });
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /**
   * Writes one status line per tab, followed by the tail of any tab that ended
   * in an error so failures survive the interactive UI being torn down.
   */
  printSummary(tailLines = 50): void {
    const tabs = this.logger.getTabs();
    if (tabs.length === 0) return;
    this.stdout.write('\n');
    for (const tab of tabs) {
      this.writeStatus(tab);
    }
    for (const tab of tabs) {
      if (tab.status.state !== 'error') continue;
      this.stdout.write('\n');
      this.writeLines(tab, tab.getLines().slice(-tailLines));
    }
  }
}

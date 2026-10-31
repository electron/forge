import { TabStatus } from './types.js';

export type TagColor = 'cyan' | 'magenta' | 'green' | 'yellow' | 'blue' | 'red';

export const TAG_COLORS: TagColor[] = [
  'cyan',
  'magenta',
  'green',
  'yellow',
  'blue',
  'red',
];

export type StatusColor = 'green' | 'yellow' | 'red' | 'cyan' | 'gray';

export interface StatusPresentation {
  glyph: string;
  color: StatusColor;
  /** Full description, e.g. `compiled in 1.2s`. */
  text: string;
  /** Compact form for the tab bar, e.g. `1.2s` or `2 errors`. */
  short: string;
}

export function formatDuration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function describeStatus(status: TabStatus): StatusPresentation {
  const duration =
    status.durationMs === undefined ? '' : formatDuration(status.durationMs);
  const withDuration = (text: string) =>
    duration ? `${text} in ${duration}` : text;
  const detail = status.detail;

  switch (status.state) {
    case 'building':
      return {
        glyph: '◌',
        color: 'cyan',
        text: detail ?? 'building…',
        short: detail ?? '',
      };
    case 'success':
      return {
        glyph: '✔',
        color: 'green',
        text: detail ?? withDuration('compiled'),
        short: detail ?? duration,
      };
    case 'warning': {
      const count = status.warnings ?? 0;
      return {
        glyph: '⚠',
        color: 'yellow',
        text:
          detail ?? withDuration(`compiled with ${plural(count, 'warning')}`),
        short: detail ?? String(count),
      };
    }
    case 'error': {
      const count = status.errors ?? 0;
      return {
        glyph: '✖',
        color: 'red',
        text: detail ?? withDuration(`failed with ${plural(count, 'error')}`),
        short: detail ?? String(count),
      };
    }
    case 'exited':
      return {
        glyph: '○',
        color: 'gray',
        text: detail ?? 'exited',
        short: detail ?? 'exited',
      };
    case 'idle':
    default:
      return {
        glyph: '●',
        color: 'gray',
        text: detail ?? '',
        short: detail ?? '',
      };
  }
}

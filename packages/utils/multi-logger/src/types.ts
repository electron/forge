export type TabState =
  | 'idle'
  | 'building'
  | 'success'
  | 'warning'
  | 'error'
  | 'exited';

export interface TabStatus {
  state: TabState;
  /** Number of errors, shown for the `error` state. */
  errors?: number;
  /** Number of warnings, shown for the `warning` state. */
  warnings?: number;
  /** How long the last build took, shown for `success` / `warning` / `error`. */
  durationMs?: number;
  /** Free-form text shown next to the status glyph. */
  detail?: string;
}

export type LoggerMode = 'ink' | 'plain';

/**
 * An extra hotkey rendered in the footer of the interactive UI.
 */
export interface LoggerKey {
  /** The single character to bind, e.g. `'r'`. */
  key: string;
  /** Short label for the footer hint, e.g. `'restart electron'`. */
  label: string;
  onPress: () => void;
}

export interface LoggerOptions {
  /** Defaults to `process.stdout`. */
  stdout?: NodeJS.WriteStream;
  /** Defaults to `process.stdin`. */
  stdin?: NodeJS.ReadStream;
  /**
   * Whether the interactive (ink) UI may be used. Defaults to
   * `stdout.isTTY && stdin.isTTY && !process.env.CI`.
   */
  interactive?: boolean;
  /** Bypass mode detection entirely. */
  forceMode?: LoggerMode;
  /** Extra hotkeys for the interactive UI. */
  keys?: LoggerKey[];
  /** Shown at the left of the tab bar. */
  title?: string;
  /** Lines kept per tab (and for the merged view). Defaults to 5000. */
  maxLines?: number;
  /**
   * Name of the tab shown first in the interactive UI, or `'all'` for the
   * merged view. Defaults to the first tab (also when no tab has that name).
   */
  initialTab?: string;
  /**
   * The interactive UI switches to a tab whose status turns to `error`, at
   * most once per this many milliseconds. Defaults to 15000.
   */
  errorSwitchDebounceMs?: number;
}

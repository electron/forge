import path from 'node:path';
import { styleText } from 'node:util';

import type { VitePluginBuildConfig } from './Config.js';
import type Logger from '@electron-forge/multi-logger';
import type { Tab } from '@electron-forge/multi-logger';
import type {
  LibraryOptions,
  LogErrorOptions,
  LogLevel,
  LogOptions,
  UserConfig,
  Logger as ViteLogger,
} from 'vite';

export function entryToDisplay(entry: LibraryOptions['entry']): string {
  if (typeof entry === 'string') return entry;
  if (Array.isArray(entry)) return entry.join(' ');
  return Object.keys(entry).join(' ');
}

/**
 * Tab name for a `build` target, e.g. `Main (src/main.ts)`.
 */
export function buildTabName(spec: VitePluginBuildConfig): string {
  const kind = spec.target === 'preload' ? 'Preload' : 'Main';
  return `${kind} (${entryToDisplay(spec.entry)})`;
}

/**
 * Tab name for a renderer dev server, e.g. `Renderer (main_window)`. The
 * renderer's name is the last segment of its output directory.
 */
export function rendererTabName(userConfig: UserConfig): string {
  const name = path.basename(userConfig.build?.outDir ?? '');
  return `Renderer (${name || 'renderer'})`;
}

/**
 * Creates a tab, numbering the name if a tab with that name already exists
 * (two targets can share an entry file).
 */
export function createUniqueTab(logger: Logger, name: string): Tab {
  let candidate = name;
  for (let n = 2; logger.getTab(candidate); n++) {
    candidate = `${name} #${n}`;
  }
  return logger.createTab(candidate);
}

const LOG_LEVELS: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
};

type LogType = 'info' | 'warn' | 'error';

const TAG_COLORS: Record<LogType, 'cyan' | 'yellow' | 'red'> = {
  info: 'cyan',
  warn: 'yellow',
  error: 'red',
};

/**
 * A Vite `customLogger` that writes into a tab instead of the console and
 * keeps the tab's status in step: warnings and errors are counted until Vite
 * starts a fresh cycle (an HMR update or page reload, which it marks with
 * `clear: true`), at which point the tab goes back to `success`. Messages are
 * formatted the way Vite's own logger formats them.
 */
export function createTabLogger(
  tab: Tab,
  level: LogLevel = 'info',
): ViteLogger {
  const threshold = LOG_LEVELS[level];
  const loggedErrors = new WeakSet<object>();
  const warnedMessages = new Set<string>();
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  const write = (type: LogType, msg: string, options: LogOptions = {}) => {
    if (threshold < LOG_LEVELS[type]) return;
    if (options.timestamp) {
      const environment = options.environment ? `${options.environment} ` : '';
      msg = `${styleText('dim', timeFormatter.format(new Date()))} ${styleText([TAG_COLORS[type], 'bold'], '[vite]')} ${environment}${msg}`;
    }
    tab.log(msg);
  };

  const logger: ViteLogger = {
    hasWarned: false,
    info(msg, options) {
      write('info', msg, options);
      if (options?.clear && tab.status.state !== 'success') {
        tab.setStatus({ state: 'success' });
      }
    },
    warn(msg, options) {
      logger.hasWarned = true;
      write('warn', msg, options);
      // Don't hide an error behind a later warning.
      if (tab.status.state === 'error') return;
      const warnings =
        (tab.status.state === 'warning' ? (tab.status.warnings ?? 0) : 0) + 1;
      tab.setStatus({ state: 'warning', warnings });
    },
    warnOnce(msg, options) {
      if (warnedMessages.has(msg)) return;
      warnedMessages.add(msg);
      logger.warn(msg, options);
    },
    error(msg, options?: LogErrorOptions) {
      logger.hasWarned = true;
      if (options?.error) loggedErrors.add(options.error);
      write('error', msg, options);
      const errors =
        (tab.status.state === 'error' ? (tab.status.errors ?? 0) : 0) + 1;
      tab.setStatus({ state: 'error', errors });
    },
    clearScreen() {
      // The tab keeps its history; there is no screen to clear.
    },
    hasErrorLogged(error) {
      return loggedErrors.has(error);
    },
  };
  return logger;
}

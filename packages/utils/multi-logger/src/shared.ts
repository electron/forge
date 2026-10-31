import Logger from './Logger.js';
import { LoggerOptions } from './types.js';

// Registered under a well-known symbol on `globalThis` rather than kept in a
// module-level variable, so that two copies of this package (one under the
// CLI, another under a plugin, say) still share one logger: a second UI would
// fight the first over the terminal.
const SHARED_LOGGER = Symbol.for('@electron-forge/multi-logger');

type SharedLoggerHost = typeof globalThis & { [SHARED_LOGGER]?: Logger };

/**
 * The process-wide logger, if {@link ensureSharedLogger} has created one.
 */
export function getSharedLogger(): Logger | undefined {
  return (globalThis as SharedLoggerHost)[SHARED_LOGGER];
}

/**
 * Returns the process-wide logger, creating and registering it on first use.
 * A logger that has been stopped is replaced by a fresh one, since it would
 * never render again: a later session in the same process (a second
 * `api.start()`, say) gets a working logger rather than a dead one.
 *
 * Only the first caller decides how the logger is set up. When a logger
 * already exists, `options` are merged additively — extra `keys` are added
 * and `title` / `initialTab` are taken only if none is set yet — and every
 * other option is ignored, since the streams and the mode are fixed at
 * construction.
 */
export function ensureSharedLogger(options?: LoggerOptions): Logger {
  const existing = getSharedLogger();
  if (existing && !existing.stopped) {
    if (options) existing.extendOptions(options);
    return existing;
  }

  const logger = new Logger(options);
  (globalThis as SharedLoggerHost)[SHARED_LOGGER] = logger;
  return logger;
}

/**
 * Forgets the process-wide logger, without stopping it. Meant for tests, so
 * each one starts from a clean slate.
 */
export function resetSharedLogger(): void {
  delete (globalThis as SharedLoggerHost)[SHARED_LOGGER];
}

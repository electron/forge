import { EventEmitter } from 'node:events';

const restartEmitter = new EventEmitter();

/**
 * Signal the running Electron app to restart.
 * Called by plugins (e.g. Vite) when the main process bundle is rebuilt.
 */
export function restartApp(): void {
  restartEmitter.emit('restart');
}

/**
 * Register a listener for app restart signals.
 * Called by the `start` API to wire up the actual restart logic.
 * Replaces any previously registered listener to avoid leaks.
 */
export function onAppRestart(listener: () => void): void {
  restartEmitter.removeAllListeners('restart');
  restartEmitter.on('restart', listener);
}

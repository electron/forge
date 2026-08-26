import debug from 'debug';

const d = debug('electron-forge:restart');

/**
 * Restarts the running Electron app on behalf of {@link requestAppRestart}.
 * Returns `true` if the restart was started or queued behind one already in
 * flight, `false` if it could not be honored.
 *
 * @internal
 */
export type AppRestartHandler = () => boolean;

// A single slot rather than an event emitter: two handlers would race each other
// to kill and respawn the same child process.
let restartHandler: AppRestartHandler | null = null;

/**
 * Requests that the running Electron app be restarted, reporting whether the
 * request was honored.
 *
 * Returns `false` rather than throwing when there is nothing to restart, which
 * is expected before the app is first spawned and in any process that isn't
 * running `electron-forge start` — such as the Vite build subprocess used when
 * packaging. Callers that can tell those cases apart should surface an unhonored
 * request, since a rebuilt bundle that never reaches the app is invisible.
 *
 * @internal
 */
export function requestAppRestart(): boolean {
  if (!restartHandler) {
    d('no restart handler is registered, ignoring the restart request');
    return false;
  }

  try {
    return restartHandler();
  } catch (err) {
    // Callers are usually bundler hooks, where a throw would be reported to the
    // user as a *build* failure.
    console.error(
      'Failed to restart the Electron app:',
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
    return false;
  }
}

/**
 * Installs the handler that {@link requestAppRestart} delegates to, replacing
 * any existing one, and returns a function that uninstalls it again.
 *
 * The handler is process-wide, so two overlapping `start()` calls contend for it
 * and only the most recent app stays restartable.
 *
 * @internal
 */
export function setAppRestartHandler(handler: AppRestartHandler): () => void {
  if (restartHandler) {
    d('replacing the previously registered restart handler');
  }
  restartHandler = handler;

  return () => {
    if (restartHandler === handler) {
      restartHandler = null;
    }
  };
}

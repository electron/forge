import type { TabStatus } from '@electron-forge/multi-logger';

/**
 * IPC messages sent by `subprocess-worker.ts` while it watches a `build`
 * target. `first-build-*` settle the plugin's "wait for the first build"
 * promise; the rest mirror the Rollup watcher's events so the terminal UI can
 * show the target's status on every rebuild.
 */
export type WorkerMessage =
  | { type: 'first-build-done' }
  | { type: 'first-build-error'; message: string }
  | { type: 'build-start' }
  | { type: 'build-done'; durationMs: number }
  | { type: 'build-error'; message: string }
  | { type: 'reload-renderers' };

/**
 * Maps a worker message onto the status of the target's tab. Returns `null`
 * when the message says nothing about the build status.
 */
export function statusFromWorkerMessage(
  msg: WorkerMessage,
  current: TabStatus,
): TabStatus | null {
  switch (msg.type) {
    case 'build-start':
      return { state: 'building' };
    case 'build-done':
      return { state: 'success', durationMs: msg.durationMs };
    case 'build-error':
    case 'first-build-error':
      return { state: 'error', errors: 1 };
    case 'first-build-done':
      // Sent from `closeBundle`, which can run either side of the watcher's
      // `BUNDLE_END` (the message that carries the duration), so only fill in
      // a status when none has been reported yet.
      return current.state === 'building' ? { state: 'success' } : null;
    default:
      return null;
  }
}

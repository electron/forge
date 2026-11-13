import { describe, expect, it } from 'vitest';

import { statusFromWorkerMessage } from '../src/worker-messages';

import type { TabStatus } from '@electron-forge/multi-logger';

const building: TabStatus = { state: 'building' };

describe('statusFromWorkerMessage', () => {
  it('maps the watcher events onto tab statuses', () => {
    expect(statusFromWorkerMessage({ type: 'build-start' }, building)).toEqual({
      state: 'building',
    });
    expect(
      statusFromWorkerMessage(
        { type: 'build-done', durationMs: 321 },
        building,
      ),
    ).toEqual({ state: 'success', durationMs: 321 });
    expect(
      statusFromWorkerMessage(
        { type: 'build-error', message: 'Could not resolve' },
        building,
      ),
    ).toEqual({ state: 'error', errors: 1 });
    expect(
      statusFromWorkerMessage(
        { type: 'first-build-error', message: 'Could not resolve' },
        building,
      ),
    ).toEqual({ state: 'error', errors: 1 });
  });

  it('lets first-build-done fill in a status only when none was reported', () => {
    expect(
      statusFromWorkerMessage({ type: 'first-build-done' }, building),
    ).toEqual({ state: 'success' });
    // BUNDLE_END already reported the duration; keep it.
    expect(
      statusFromWorkerMessage(
        { type: 'first-build-done' },
        { state: 'success', durationMs: 321 },
      ),
    ).toBeNull();
    expect(
      statusFromWorkerMessage(
        { type: 'first-build-done' },
        { state: 'error', errors: 1 },
      ),
    ).toBeNull();
  });

  it('ignores messages that say nothing about the build', () => {
    expect(
      statusFromWorkerMessage({ type: 'reload-renderers' }, building),
    ).toBeNull();
  });
});

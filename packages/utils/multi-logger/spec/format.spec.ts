import { describe, expect, it } from 'vitest';

import { describeStatus, formatDuration } from '../src/format';

describe('formatDuration', () => {
  it('uses milliseconds below a second and seconds above', () => {
    expect(formatDuration(250)).toBe('250ms');
    expect(formatDuration(1234)).toBe('1.2s');
  });
});

describe('describeStatus', () => {
  it('describes each state', () => {
    expect(describeStatus({ state: 'idle' })).toMatchObject({
      glyph: '●',
      text: '',
    });
    expect(describeStatus({ state: 'building' })).toMatchObject({
      color: 'cyan',
      text: 'building…',
    });
    expect(
      describeStatus({ state: 'success', durationMs: 1200 }),
    ).toMatchObject({ glyph: '✔', text: 'compiled in 1.2s', short: '1.2s' });
    expect(
      describeStatus({ state: 'warning', warnings: 2, durationMs: 300 }),
    ).toMatchObject({
      glyph: '⚠',
      text: 'compiled with 2 warnings in 300ms',
      short: '2',
    });
    expect(describeStatus({ state: 'error', errors: 1 })).toMatchObject({
      glyph: '✖',
      color: 'red',
      text: 'failed with 1 error',
    });
    expect(
      describeStatus({ state: 'exited', detail: 'exited with code 0' }),
    ).toMatchObject({ glyph: '○', text: 'exited with code 0' });
  });

  it('prefers an explicit detail', () => {
    expect(describeStatus({ state: 'idle', detail: 'running' }).text).toBe(
      'running',
    );
  });
});

import { describe, expect, it, vi } from 'vitest';

import once from '../../src/util/once';

describe('Once', () => {
  it('triggers wrapped function', () => {
    const fakeA = vi.fn();
    const fakeB = vi.fn();
    const [wrappedA] = once(fakeA, fakeB);
    wrappedA();
    expect(fakeA).toHaveBeenCalled();
    expect(fakeB).not.toHaveBeenCalled();
  });

  it('triggers only once', () => {
    const fakeA = vi.fn();
    const fakeB = vi.fn();
    const [wrappedA, wrappedB] = once(fakeA, fakeB);
    wrappedA();
    wrappedB();
    expect(fakeA).toHaveBeenCalled();
    expect(fakeB).not.toHaveBeenCalled();
  });
});

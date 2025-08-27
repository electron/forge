import { describe, expect, it } from 'vitest';

import { toMsixArch } from '../../src/util/arch';

describe('toMsixArch', () => {
  [
    {
      arch: 'x64',
      expectedMsixArch: 'x64',
    },
    {
      arch: 'arm64',
      expectedMsixArch: 'arm64',
    },
    {
      arch: 'x86',
      expectedMsixArch: 'x86',
    },
    {
      arch: 'ia32',
      expectedMsixArch: 'x86',
    },
  ].forEach((test) => {
    it(`${test.arch} converts to ${test.expectedMsixArch}`, () => {
      expect(toMsixArch(test.arch)).toBe(test.expectedMsixArch);
    });
  });

  it(`throw for arch's without a match`, () => {
    expect(() => toMsixArch('armv7l')).toThrowError(
      'Invalid architecture: armv7l. Must be one of x64, arm64, x86 or ia32',
    );
  });
});

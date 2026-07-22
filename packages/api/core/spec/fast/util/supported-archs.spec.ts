import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  assertSupportedArch,
  filterSupportedArchs,
  isDroppedArch,
} from '../../../src/util/supported-archs';

describe('supported-archs', () => {
  describe('isDroppedArch', () => {
    it('returns false for platform/arch combinations Electron still publishes', () => {
      expect(isDroppedArch('win32', 'x64', '45.0.0')).toEqual(false);
      expect(isDroppedArch('win32', 'arm64', '45.0.0')).toEqual(false);
      expect(isDroppedArch('linux', 'x64', '45.0.0')).toEqual(false);
      expect(isDroppedArch('linux', 'arm64', '45.0.0')).toEqual(false);
      expect(isDroppedArch('darwin', 'arm64', '45.0.0')).toEqual(false);
    });

    it('returns false for ia32/armv7l on Electron <= 43', () => {
      expect(isDroppedArch('win32', 'ia32', '43.0.0')).toEqual(false);
      expect(isDroppedArch('linux', 'armv7l', '43.5.1')).toEqual(false);
      expect(isDroppedArch('win32', 'ia32', '33.0.0')).toEqual(false);
    });

    it('returns false for the Electron 44 prereleases that still shipped the dropped arches', () => {
      expect(isDroppedArch('win32', 'ia32', '44.0.0-alpha.1')).toEqual(false);
      expect(isDroppedArch('win32', 'ia32', '44.0.0-alpha.3')).toEqual(false);
      expect(isDroppedArch('linux', 'armv7l', '44.0.0-alpha.3')).toEqual(false);
    });

    it('returns true for ia32/armv7l from 44.0.0-alpha.4 onwards', () => {
      expect(isDroppedArch('win32', 'ia32', '44.0.0-alpha.4')).toEqual(true);
      expect(isDroppedArch('win32', 'ia32', '44.0.0')).toEqual(true);
      expect(isDroppedArch('win32', 'ia32', '45.0.0')).toEqual(true);
      expect(isDroppedArch('linux', 'armv7l', '44.0.0-alpha.4')).toEqual(true);
      expect(
        isDroppedArch('linux', 'armv7l', '45.0.0-nightly.20260714'),
      ).toEqual(true);
    });

    it('only drops the arch on the platform Electron dropped it for', () => {
      expect(isDroppedArch('linux', 'ia32', '45.0.0')).toEqual(false);
      expect(isDroppedArch('win32', 'armv7l', '45.0.0')).toEqual(false);
    });

    it('returns false when the Electron version is not a valid semver version', () => {
      expect(isDroppedArch('win32', 'ia32', 'not-a-version')).toEqual(false);
    });
  });

  describe('assertSupportedArch', () => {
    it('does not throw for supported combinations', () => {
      expect(() =>
        assertSupportedArch('win32', 'ia32', '43.0.0'),
      ).not.toThrow();
      expect(() => assertSupportedArch('win32', 'x64', '45.0.0')).not.toThrow();
    });

    it('throws a descriptive error for dropped combinations', () => {
      expect(() => assertSupportedArch('win32', 'ia32', '44.0.0')).toThrow(
        /Electron >= 44 no longer publishes Windows ia32 \/ Linux armv7l builds/,
      );
      expect(() => assertSupportedArch('linux', 'armv7l', '45.0.0')).toThrow(
        /Use Electron <= 43 \(supported until Jan 2027\)/,
      );
    });
  });

  describe('filterSupportedArchs', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('passes through arches for Electron <= 43 untouched', () => {
      expect(
        filterSupportedArchs('win32', ['ia32', 'x64', 'arm64'], '43.0.0'),
      ).toEqual(['ia32', 'x64', 'arm64']);
    });

    it('filters dropped arches and warns for Electron >= 44.0.0-alpha.4', () => {
      const warnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      expect(
        filterSupportedArchs('win32', ['ia32', 'x64', 'arm64'], '44.0.0'),
      ).toEqual(['x64', 'arm64']);
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping win32/ia32'),
      );
    });
  });
});

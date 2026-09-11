import { afterEach, describe, expect, it, vi } from 'vitest';

import parseArchs from '../../../src/util/parse-archs';

describe('parse-archs', () => {
  it('should make an Array out of one arch', () => {
    expect(parseArchs('linux', 'x64', '1.7.0')).toEqual(['x64']);
  });

  it('should transform comma-separated values into an Array', () => {
    expect(parseArchs('linux', 'ia32,x64', '1.7.0')).toEqual(['ia32', 'x64']);
  });

  it('should use the official Electron arch list when arch is "all"', () => {
    expect(parseArchs('win32', 'all', '1.7.0')).toEqual(['ia32', 'x64']);
    expect(parseArchs('win32', 'all', '33.0.0')).toEqual([
      'ia32',
      'x64',
      'arm64',
    ]);
  });

  it('should default to [x64] when the platform is unknown', () => {
    expect(parseArchs('nonexistent', 'all', '1.7.0')).toEqual(['x64']);
  });

  describe('archs dropped by Electron 44', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should keep ia32/armv7l in "all" for Electron <= 43 and the early 44 prereleases', () => {
      expect(parseArchs('win32', 'all', '43.0.0')).toEqual([
        'ia32',
        'x64',
        'arm64',
      ]);
      expect(parseArchs('win32', 'all', '44.0.0-alpha.3')).toEqual([
        'ia32',
        'x64',
        'arm64',
      ]);
      expect(parseArchs('linux', 'all', '43.0.0')).toContain('armv7l');
      expect(parseArchs('linux', 'all', '44.0.0-alpha.3')).toContain('armv7l');
    });

    it('should exclude ia32/armv7l from "all" for Electron >= 44.0.0-alpha.4', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      expect(parseArchs('win32', 'all', '44.0.0-alpha.4')).toEqual([
        'x64',
        'arm64',
      ]);
      expect(parseArchs('win32', 'all', '44.0.0')).toEqual(['x64', 'arm64']);
      expect(parseArchs('win32', 'all', '45.0.0')).toEqual(['x64', 'arm64']);
      expect(parseArchs('linux', 'all', '44.0.0-alpha.4')).not.toContain(
        'armv7l',
      );
      expect(
        parseArchs('linux', 'all', '45.0.0-nightly.20260714'),
      ).not.toContain('armv7l');
    });

    it('should warn when filtering a dropped arch out of "all"', () => {
      const warnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      parseArchs('win32', 'all', '44.0.0');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Skipping win32/ia32'),
      );
    });

    it('should throw for explicitly requested dropped archs on Electron >= 44.0.0-alpha.4', () => {
      expect(() => parseArchs('win32', 'ia32', '44.0.0')).toThrow(
        /Electron >= 44 no longer publishes Windows ia32 \/ Linux armv7l builds/,
      );
      expect(() => parseArchs('win32', 'ia32,x64', '44.0.0-alpha.4')).toThrow(
        /Use Electron <= 43 \(supported until Jan 2027\)/,
      );
      expect(() => parseArchs('linux', 'armv7l', '45.0.0')).toThrow(
        /no longer publishes/,
      );
    });

    it('should allow explicitly requested dropped archs on Electron <= 43', () => {
      expect(parseArchs('win32', 'ia32', '43.0.0')).toEqual(['ia32']);
      expect(parseArchs('linux', 'armv7l', '44.0.0-alpha.3')).toEqual([
        'armv7l',
      ]);
    });
  });
});

import { describe, expect, it } from 'vitest';

import filenamify from '../../../src/util/filenamify';

describe('filenamify', () => {
  describe('basic sanitization', () => {
    it('should leave a valid filename unchanged', () => {
      expect(filenamify('foo')).toBe('foo');
      expect(filenamify('my-app')).toBe('my-app');
      expect(filenamify('My App 1.0')).toBe('My App 1.0');
    });

    it('should replace reserved POSIX/Windows characters with the default replacement (!)', () => {
      expect(filenamify('foo/bar')).toBe('foo!bar');
      expect(filenamify('foo\\bar')).toBe('foo!bar');
      expect(filenamify('foo:bar')).toBe('foo!bar');
      expect(filenamify('foo*bar')).toBe('foo!bar');
      expect(filenamify('foo?bar')).toBe('foo!bar');
      expect(filenamify('foo"bar')).toBe('foo!bar');
      expect(filenamify('foo<bar')).toBe('foo!bar');
      expect(filenamify('foo>bar')).toBe('foo!bar');
      expect(filenamify('foo|bar')).toBe('foo!bar');
    });

    it('should collapse runs of reserved characters into a single replacement', () => {
      expect(filenamify('foo//bar')).toBe('foo!bar');
      expect(filenamify('//foo//bar//')).toBe('!foo!bar!');
      expect(filenamify('foo\\\\\\bar')).toBe('foo!bar');
      expect(filenamify('foo<<>>bar')).toBe('foo!bar');
    });

    it('should not collapse runs when the replacement is empty', () => {
      expect(filenamify('foo//bar', { replacement: '' })).toBe('foobar');
      expect(filenamify('//foo//bar//', { replacement: '' })).toBe('foobar');
    });
  });

  describe('replacement option', () => {
    it('should use a custom replacement string', () => {
      expect(filenamify('foo/bar', { replacement: '-' })).toBe('foo-bar');
      expect(filenamify('foo:bar:baz', { replacement: '_' })).toBe(
        'foo_bar_baz',
      );
    });

    it('should support an empty replacement string', () => {
      expect(filenamify('foo/bar', { replacement: '' })).toBe('foobar');
      expect(filenamify('a<b>c:d', { replacement: '' })).toBe('abcd');
    });

    it('should support a multi-character replacement string', () => {
      expect(filenamify('foo/bar', { replacement: '__' })).toBe('foo__bar');
    });
  });

  describe('relative path markers', () => {
    it('should replace leading relative path segments', () => {
      expect(filenamify('../foo')).toBe('!foo');
      expect(filenamify('..\\foo')).toBe('!foo');
      expect(filenamify('./foo')).toBe('!foo');
      expect(filenamify('....../foo')).toBe('!foo');
    });

    it('should replace a name that is only dots', () => {
      expect(filenamify('.')).toBe('!');
      expect(filenamify('..')).toBe('!');
      expect(filenamify('...')).toBe('!');
    });

    it('should preserve a leading dot that is not a relative path marker', () => {
      expect(filenamify('.dotfile')).toBe('.dotfile');
    });
  });

  describe('trailing periods', () => {
    it('should strip trailing periods', () => {
      expect(filenamify('foo.')).toBe('foo');
      expect(filenamify('foo..')).toBe('foo');
      expect(filenamify('foo...')).toBe('foo');
    });

    it('should strip trailing periods after replacement', () => {
      expect(filenamify('foo/.')).toBe('foo!');
      expect(filenamify('foo.bar.')).toBe('foo.bar');
    });
  });

  describe('control characters', () => {
    it('should replace C0 control characters', () => {
      const nul = String.fromCharCode(0);
      const tab = String.fromCharCode(9);
      const us = String.fromCharCode(31);
      expect(filenamify(`foo${nul}bar`)).toBe('foo!bar');
      expect(filenamify(`foo${tab}bar`)).toBe('foo!bar');
      expect(filenamify(`foo${us}bar`)).toBe('foo!bar');
    });

    it('should replace C1 control characters', () => {
      const c1a = String.fromCharCode(0x80);
      const c1b = String.fromCharCode(0x9f);
      expect(filenamify(`foo${c1a}bar`)).toBe('foo!bar');
      expect(filenamify(`foo${c1b}bar`)).toBe('foo!bar');
    });
  });

  describe('Windows reserved device names', () => {
    it('should append the replacement to reserved names (case-insensitive)', () => {
      expect(filenamify('con')).toBe('con!');
      expect(filenamify('CON')).toBe('CON!');
      expect(filenamify('prn')).toBe('prn!');
      expect(filenamify('aux')).toBe('aux!');
      expect(filenamify('nul')).toBe('nul!');
      expect(filenamify('com1')).toBe('com1!');
      expect(filenamify('lpt9')).toBe('lpt9!');
    });

    it('should not modify names that merely contain a reserved name', () => {
      expect(filenamify('cont')).toBe('cont');
      expect(filenamify('console')).toBe('console');
      expect(filenamify('com10')).toBe('com10');
    });

    it('should leave reserved names unchanged when the replacement is empty', () => {
      expect(filenamify('con', { replacement: '' })).toBe('con');
    });
  });

  describe('unicode normalization', () => {
    it('should NFD-normalize the result', () => {
      const composed = String.fromCharCode(0x63, 0x61, 0x66, 0x00e9);
      const decomposed = String.fromCharCode(0x63, 0x61, 0x66, 0x65, 0x0301);
      expect(filenamify(composed)).toBe(decomposed);
    });
  });

  describe('length truncation', () => {
    it('should truncate to 100 characters by default', () => {
      const long = 'a'.repeat(150);
      expect(filenamify(long)).toBe('a'.repeat(100));
    });

    it('should preserve the extension when truncating', () => {
      const long = 'a'.repeat(150) + '.txt';
      const result = filenamify(long);
      expect(result.length).toBe(100);
      expect(result.endsWith('.txt')).toBe(true);
    });

    it('should respect a custom maxLength', () => {
      expect(filenamify('abcdefghij', { maxLength: 5 })).toBe('abcde');
    });

    it('should preserve the extension with a custom maxLength', () => {
      const result = filenamify('abcdefghij.txt', { maxLength: 8 });
      expect(result).toBe('abcd.txt');
    });

    it('should keep at least one base character when the extension is longer than maxLength', () => {
      const result = filenamify('abc.longextension', { maxLength: 4 });
      expect(result).toBe('a.longextension');
    });

    it('should not truncate when under the limit', () => {
      expect(filenamify('short.txt')).toBe('short.txt');
    });
  });

  describe('input validation', () => {
    it('should throw a TypeError for non-string input', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => filenamify(123 as any)).toThrow(TypeError);
    });
  });

  describe('Forge usage (replacement: "-")', () => {
    it('should sanitize a scoped package name', () => {
      expect(filenamify('@scope/my-app', { replacement: '-' })).toBe(
        '@scope-my-app',
      );
    });

    it('should sanitize a productName with reserved characters', () => {
      expect(filenamify('My: App / Name', { replacement: '-' })).toBe(
        'My- App - Name',
      );
    });

    it('should collapse repeated separators with a hyphen replacement', () => {
      expect(filenamify('foo///bar', { replacement: '-' })).toBe('foo-bar');
    });
  });
});

import { describe, expect, it } from 'vitest';

import { getNameFromAuthor, parseAuthor } from '../src/author-name';

describe('parseAuthor', () => {
  it('parses name only', () => {
    expect(parseAuthor('Jon Schlinkert')).toEqual({ name: 'Jon Schlinkert' });
  });

  it('parses name and email', () => {
    expect(parseAuthor('Jon Schlinkert <jon@foo.com>')).toEqual({
      name: 'Jon Schlinkert',
      email: 'jon@foo.com',
    });
  });

  it('parses name, email, and url', () => {
    expect(
      parseAuthor('Jon Schlinkert <jon@foo.com> (https://github.com)'),
    ).toEqual({
      name: 'Jon Schlinkert',
      email: 'jon@foo.com',
      url: 'https://github.com',
    });
  });

  it('parses name and url', () => {
    expect(parseAuthor('Jon Schlinkert (https://github.com)')).toEqual({
      name: 'Jon Schlinkert',
      url: 'https://github.com',
    });
  });

  it('parses email only', () => {
    expect(parseAuthor('<jon@foo.com>')).toEqual({ email: 'jon@foo.com' });
  });

  it('parses url only', () => {
    expect(parseAuthor('(https://github.com)')).toEqual({
      url: 'https://github.com',
    });
  });

  it('returns empty object for empty string', () => {
    expect(parseAuthor('')).toEqual({});
  });

  it('returns empty object for whitespace-only string', () => {
    expect(parseAuthor('   ')).toEqual({});
  });

  it('throws on non-string input', () => {
    expect(() => parseAuthor(123 as unknown as string)).toThrow(TypeError);
  });
});

describe('getNameFromAuthor', () => {
  [
    {
      author: 'First Last',
      expectedReturnValue: 'First Last',
    },
    {
      author: 'First Last <first.last@example.com>',
      expectedReturnValue: 'First Last',
    },
    {
      author: {
        name: 'First Last',
      },
      expectedReturnValue: 'First Last',
    },
    {
      author: undefined,
      expectedReturnValue: '',
    },
    {
      author: '',
      expectedReturnValue: '',
    },
  ].forEach((scenario) => {
    it(`${JSON.stringify(scenario.author)} -> "${scenario.expectedReturnValue}"`, () => {
      expect(getNameFromAuthor(scenario.author)).toBe(
        scenario.expectedReturnValue,
      );
    });
  });
});

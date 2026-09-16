import { describe, expect, it } from 'vitest';

import { splitLines } from '../src/lines';

describe('splitLines', () => {
  it('returns nothing for empty text', () => {
    expect(splitLines('')).toEqual([]);
  });

  it('splits on any newline style', () => {
    expect(splitLines('a\nb\r\nc\rd')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('drops a single trailing newline but keeps blank lines', () => {
    expect(splitLines('a\n')).toEqual(['a']);
    expect(splitLines('a\n\n')).toEqual(['a', '']);
    expect(splitLines('\n')).toEqual(['']);
  });

  it('keeps ANSI escapes intact', () => {
    const red = `${String.fromCharCode(0x1b)}[31mred${String.fromCharCode(0x1b)}[39m`;
    expect(splitLines(`${red}\nplain`)).toEqual([red, 'plain']);
  });
});

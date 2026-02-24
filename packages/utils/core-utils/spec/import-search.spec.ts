import { describe, expect, it } from 'vitest';

import * as authorName from '../src/author-name';
import { importSearch, importSearchRaw } from '../src/import-search';

describe('import-search', () => {
  it('should resolve null if no file exists', async () => {
    const resolved = await importSearch(__dirname, ['../src/wizard-secrets']);
    expect(resolved).toEqual(null);
  });

  it('should resolve a file if it exists', async () => {
    const resolved = await importSearchRaw(__dirname, ['../src/author-name']);
    expect(resolved).toEqual(authorName);
  });

  it('should throw if file exists but fails to load', async () => {
    await expect(
      importSearch(__dirname, ['./fixture/require-search/throw-error']),
    ).rejects.toThrowError('test');
  });
});

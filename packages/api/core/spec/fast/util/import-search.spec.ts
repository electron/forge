import { describe, expect, it } from 'vitest';

import findConfig from '../../../src/util/forge-config';
import importSearch from '../../../src/util/import-search';

describe('import-search', () => {
  it('should resolve null if no file exists', async () => {
    const resolved = await importSearch(__dirname, ['../../../src/util/wizard-secrets']);
    expect(resolved).toEqual(null);
  });

  it('should resolve a file if it exists', async () => {
    const resolved = await importSearch(__dirname, ['../../../src/util/forge-config']);
    expect(resolved).toEqual(findConfig);
  });

  it('should throw if file exists but fails to load', async () => {
    await expect(importSearch(__dirname, ['../../fixture/require-search/throw-error'])).rejects.toThrowError('test');
  });
});

import { expect } from 'chai';

import findConfig from '../../src/util/forge-config';
import importSearch from '../../src/util/import-search';

describe('import-search', () => {
  it('should resolve null if no file exists', async () => {
    const resolved = await importSearch(__dirname, ['../../src/util/wizard-secrets']);
    expect(resolved).to.equal(null);
  });

  it('should resolve a file if it exists', async () => {
    const resolved = await importSearch(__dirname, ['../../src/util/forge-config']);
    expect(resolved).to.equal(findConfig);
  });

  it('should throw if file exists but fails to load', async () => {
    let test: () => unknown;
    try {
      const ret = await importSearch(__dirname, ['../fixture/require-search/throw-error']);
      test = () => ret;
    } catch (error) {
      test = () => {
        throw error;
      };
    }
    expect(test).to.throw('test');
  });
});

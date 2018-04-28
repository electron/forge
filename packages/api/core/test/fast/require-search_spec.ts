import { expect } from 'chai';

import requireSearch from '../../src/util/require-search';
import findConfig from '../../src/util/forge-config';

describe('require-search', () => {
  it('should resolve null if no file exists', () => {
    const resolved = requireSearch(__dirname, ['../../src/util/wizard-secrets']);
    expect(resolved).to.equal(null);
  });

  it('should resolve a file if it exists', () => {
    const resolved = requireSearch(__dirname, ['../../src/util/forge-config']);
    expect(resolved).to.equal(findConfig);
  });
});

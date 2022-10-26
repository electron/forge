import { expect } from 'chai';

import findConfig from '../../src/util/forge-config';
import requireSearch from '../../src/util/require-search';

describe('require-search', () => {
  it('should resolve null if no file exists', () => {
    const resolved = requireSearch(__dirname, ['../../src/util/wizard-secrets']);
    expect(resolved).to.equal(null);
  });

  it('should resolve a file if it exists', () => {
    const resolved = requireSearch(__dirname, ['../../src/util/forge-config']);
    expect(resolved).to.equal(findConfig);
  });

  it('should throw if file exists but fails to load', () => {
    expect(() => {
      requireSearch(__dirname, ['../fixture/require-search/throw-error']);
    }).to.throw('test');
  });
});

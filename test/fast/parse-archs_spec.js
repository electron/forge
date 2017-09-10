import { expect } from 'chai';

import parseArchs from '../../src/util/parse-archs';

describe('parse-archs', () => {
  it('should make an Array out of one arch', () => {
    expect(parseArchs('linux', 'x64', '1.7.0')).to.deep.equal(['x64']);
  });

  it('should transform comma-separated values into an Array', () => {
    expect(parseArchs('linux', 'ia32,x64', '1.7.0')).to.deep.equal(['ia32', 'x64']);
  });

  it('should use the official Electron arch list when arch is "all"', () => {
    expect(parseArchs('win32', 'all', '1.7.0')).to.deep.equal(['ia32', 'x64']);
  });

  it('should default to [x64] when the platform is unknown', () => {
    expect(parseArchs('nonexistent', 'all', '1.7.0')).to.deep.equal(['x64']);
  });
});

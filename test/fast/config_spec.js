import { expect } from 'chai';

import config from '../../src/util/config';

describe('cross-process config', () => {
  it('should get all values as undefined initially', () => {
    expect(config.get('foobar')).to.equal(undefined);
  });

  it('should set a value in the current process', () => {
    config.set('foobar', 'magical');
    expect(config.get('foobar')).to.equal('magical');
  });

  it('should reset the value on process exit', () => {
    config.reset();
    expect(config.get('foobar')).to.equal(undefined);
  });
});

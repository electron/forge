import { expect } from 'chai';
import fs from 'fs-extra';

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

  it('should not have issues if the config file is cleaned up', async () => {
    await fs.remove(config._path);
    expect(config.get('foobar')).to.equal(undefined);
    config.set('foobar', '123');
    expect(config.get('foobar')).to.equal('123');
  });

  after(() => {
    config.reset();
  });
});

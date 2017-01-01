import { expect } from 'chai';
import path from 'path';

import resolveDir from '../../src/util/resolve-dir';

describe('resolve-dir', () => {
  it('should return null if a valid dir can not be found', async () => {
    expect(await resolveDir('/foo/var/fake')).to.be.equal(null);
  });

  it('should return a directory if it finds a node module', async () => {
    expect(await resolveDir(path.resolve(__dirname, '../fixture/dummy_app/foo'))).to.not.be.equal(null);
    expect(await resolveDir(path.resolve(__dirname, '../fixture/dummy_app/foo'))).to.be.equal(path.resolve(__dirname, '../fixture/dummy_app'));
  });
});

import path from 'path';

import { expect } from 'chai';

import resolveDir from '../../src/util/resolve-dir';

describe('resolve-dir', () => {
  it('should return null if a valid dir can not be found', async () => {
    expect(await resolveDir('/foo/var/fake')).to.be.equal(null);
  });

  it('should return a directory if a forge config is found, but no package.json.forge.config', async () => {
    expect(await resolveDir(path.resolve(__dirname, '../fixture/forge-config-no-package-json-config/'))).to.not.be.equal(null);
    expect(await resolveDir(path.resolve(__dirname, '../fixture/forge-config-no-package-json-config/'))).to.be.equal(
      path.resolve(__dirname, '../fixture/forge-config-no-package-json-config')
    );
  });

  it('should return a directory if it finds a node module', async () => {
    expect(await resolveDir(path.resolve(__dirname, '../fixture/dummy_app/foo'))).to.not.be.equal(null);
    expect(await resolveDir(path.resolve(__dirname, '../fixture/dummy_app/foo'))).to.be.equal(path.resolve(__dirname, '../fixture/dummy_app'));
  });
});

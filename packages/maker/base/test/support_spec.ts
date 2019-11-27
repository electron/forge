import { expect } from 'chai';

import MakerBase from '../src/Maker';

class MakerImpl extends MakerBase<{}> {
  name = 'test';

  defaultPlatforms = [];
}

describe('ensureExternalBinariesExist', () => {
  const maker = new MakerImpl({}, []);

  it('returns true when all binaries exist', () => {
    expect(maker.ensureExternalBinariesExist(['node'])).to.equal(true);
  });

  it('throws an error when one of the binaries does not exist', () => {
    expect(() => maker.ensureExternalBinariesExist(['bash', 'nonexistent'])).to.throw(/the following external binaries need to be installed: bash, nonexistent/);
  });
});

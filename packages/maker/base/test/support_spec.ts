import { expect } from 'chai';

import { EmptyConfig, MakerBase } from '../src/Maker';

class MakerImpl extends MakerBase<EmptyConfig> {
  name = 'test';

  defaultPlatforms = [];

  requiredExternalBinaries = ['bash', 'nonexistent'];
}

describe('ensureExternalBinariesExist', () => {
  const maker = new MakerImpl({}, []);

  it('throws an error when one of the binaries does not exist', () => {
    expect(() => maker.ensureExternalBinariesExist()).to.throw(/the following external binaries need to be installed: bash, nonexistent/);
  });
});

import { expect } from 'chai';

import checkSystem from '../../src/util/check-system';

describe('check-system', () => {
  it('should succeed on valid agents', async () => {
    expect(await checkSystem()).to.be.equal(true);
  });
});

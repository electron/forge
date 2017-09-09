import { expect } from 'chai';

import checkSystem from '../../src/util/check-system';
import { fakeOra } from '../../src/util/ora';

describe('check-system', () => {
  it('should succeed on valid agents', async () => {
    expect(await checkSystem(fakeOra())).to.be.equal(true);
  });
});

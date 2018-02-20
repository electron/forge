import { expect } from 'chai';

import Publisher from '../src/Publisher';

describe('Publisher', () => {
  it('should define __isElectronForgePublisher', () => {
    const publisher = new Publisher('test');
    expect(publisher).to.have.property('__isElectronForgePublisher', true);
  });

  it('should throw an error when install is called', (done) => {
    const publisher = new Publisher('test');
    publisher.publish({}).catch(() => done());
  });
});

import { expect } from 'chai';

import Publisher from '../src/Publisher';

class PublisherImpl extends Publisher<null> {
  defaultPlatforms = [];
  name = 'test';
}

describe('Publisher', () => {
  it('should define __isElectronForgePublisher', () => {
    const publisher = new PublisherImpl(null);
    expect(publisher).to.have.property('__isElectronForgePublisher', true);
  });

  it('should throw an error when publish is called is called', (done) => {
    const publisher = new PublisherImpl(null);
    publisher.publish({} as any).catch(() => done());
  });
});

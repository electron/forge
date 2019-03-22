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

  it('__isElectronForgePublisher should not be settable', () => {
    const publisher = new PublisherImpl(null);
    expect(() => {
      // eslint-disable-next-line no-underscore-dangle
      (publisher as any).__isElectronForgePublisher = false;
    }).to.throw();
    expect(() => {
      Object.defineProperty(publisher, '__isElectronForgePublisher', {
        value: false,
      });
    }).to.throw();
    expect(publisher).to.have.property('__isElectronForgePublisher', true);
  });

  it('should throw an error when publish is called is called', (done) => {
    const publisher = new PublisherImpl(null);
    publisher.publish({} as any).catch(() => done());
  });
});

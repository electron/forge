import { describe, expect, it } from 'vitest';

import Publisher, { PublisherOptions } from '../src/Publisher';

class PublisherImpl extends Publisher<null> {
  defaultPlatforms = [];

  name = 'test';
}

describe('Publisher', () => {
  it('should define __isElectronForgePublisher', () => {
    const publisher = new PublisherImpl(null);
    expect(publisher).toHaveProperty('__isElectronForgePublisher', true);
  });

  it('__isElectronForgePublisher should not be settable', () => {
    const publisher = new PublisherImpl(null);
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (publisher as any).__isElectronForgePublisher = false;
    }).toThrow();
    expect(() => {
      Object.defineProperty(publisher, '__isElectronForgePublisher', {
        value: false,
      });
    }).toThrow();
    expect(publisher).toHaveProperty('__isElectronForgePublisher', true);
  });

  it('should throw an error when publish is called is called', async () => {
    const publisher = new PublisherImpl(null);
    await expect(publisher.publish({} as PublisherOptions)).rejects.toThrow();
  });
});

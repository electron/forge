import { expect } from 'chai';
import { stub } from 'sinon';

import { MakerBase } from '../src/Maker';

class MakerImpl extends MakerBase<{ a: number }> {
  name = 'test';

  defaultPlatforms = [];
}

describe('prepareConfig', () => {
  it('should call the provided configure function', () => {
    const fetcher = stub();
    fetcher.returns({
      a: 123,
    });
    const maker = new MakerImpl(fetcher, []);
    expect(maker.config).to.be.undefined;
    expect(fetcher.callCount).to.equal(0);
    maker.prepareConfig('x64');
    expect(maker.config).to.deep.equal({
      a: 123,
    });
    expect(fetcher.callCount).to.equal(1);
    expect(fetcher.firstCall.args).to.deep.equal(['x64']);
  });

  it('should hand through the provided object', () => {
    const maker = new MakerImpl(
      {
        a: 234,
      },
      []
    );
    expect(maker.config).to.be.undefined;
    maker.prepareConfig('x64');
    expect(maker.config).to.deep.equal({
      a: 234,
    });
  });
});

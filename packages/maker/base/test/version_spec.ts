import { expect } from 'chai';

import { EmptyConfig, MakerBase } from '../src/Maker';

class MakerImpl extends MakerBase<EmptyConfig> {
  name = 'test';

  defaultPlatforms = [];
}

describe('normalizeWindowsVersion', () => {
  const maker = new MakerImpl({}, []);

  it('removes everything after the dash', () => {
    for (const version of ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-0.3.7', '1.0.0-x.7.z.92']) {
      expect(maker.normalizeWindowsVersion(version)).to.equal('1.0.0.0');
    }
  });
  it('removes everything after the plus sign', () => {
    for (const version of ['1.0.0-alpha+001', '1.0.0+20130313144700', '1.0.0-beta+exp.sha.5114f85', '1.0.0+21AF26D3----117B344092BD']) {
      expect(maker.normalizeWindowsVersion(version)).to.equal('1.0.0.0');
    }
  });
  it('does not truncate the version when there is no dash', () => {
    expect(maker.normalizeWindowsVersion('2.0.0')).to.equal('2.0.0.0');
  });
});

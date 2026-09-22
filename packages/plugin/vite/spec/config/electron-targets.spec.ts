import { describe, expect, it } from 'vitest';

import { getElectronTargets } from '../../src/config/electron-targets';

describe('getElectronTargets', () => {
  it('maps a known Electron major to its Node and Chrome targets', () => {
    expect(getElectronTargets('38.0.0')).toEqual({
      node: 'node22.19',
      chrome: 'chrome140',
    });
    expect(getElectronTargets('28.3.1')).toEqual({
      node: 'node18.18',
      chrome: 'chrome120',
    });
  });

  it('maps prerelease versions by their major', () => {
    expect(getElectronTargets('39.0.0-beta.1')).toEqual({
      node: 'node22.20',
      chrome: 'chrome142',
    });
    expect(getElectronTargets('39.0.0-nightly.20250101')).toEqual({
      node: 'node22.20',
      chrome: 'chrome142',
    });
  });

  it('falls back to the newest known entry for newer Electron majors', () => {
    expect(getElectronTargets('999.0.0')).toEqual(getElectronTargets('41.0.0'));
  });

  it('returns no targets for Electron majors older than the table', () => {
    expect(getElectronTargets('27.0.0')).toEqual({});
    expect(getElectronTargets('10.0.0')).toEqual({});
  });

  it('returns no targets for versions it cannot parse', () => {
    expect(getElectronTargets('')).toEqual({});
    expect(getElectronTargets('latest')).toEqual({});
  });
});

import { describe, expect, it } from 'vitest';

import { getElectronTargets } from '../../src/config/electron-targets';

describe('getElectronTargets', () => {
  it('maps a known Electron major to its Node and Chrome targets', () => {
    expect(getElectronTargets('38.0.0')).toEqual({
      node: 'node22.18',
      chrome: 'chrome140',
    });
    expect(getElectronTargets('40.0.0')).toEqual({
      node: 'node24.11',
      chrome: 'chrome144',
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

  it('reuses the newest known Node entry for newer Electron majors, but still maps their Chrome version', () => {
    // Electron 45 is past the Node table, yet electron-to-chromium knows it.
    expect(getElectronTargets('45.0.0')).toEqual({
      node: getElectronTargets('44.0.0').node,
      chrome: 'chrome155',
    });
  });

  it('is not sensitive to the order of the table', () => {
    // The lookup sorts the table, so a major between two entries resolves to
    // the newest entry at or below it rather than to whatever comes first.
    expect(getElectronTargets('42.3.3')).toEqual({
      node: 'node24.15',
      chrome: 'chrome148',
    });
  });

  it('falls back to the newest known entries for Electron majors nothing knows about', () => {
    const targets = getElectronTargets('999.0.0');

    // The newest row in the table; update alongside it.
    expect(targets.node).toEqual(getElectronTargets('44.0.0').node);
    // Whatever Chromium the installed mapping tops out at, never an older one.
    expect(
      Number(targets.chrome?.replace('chrome', '')),
    ).toBeGreaterThanOrEqual(146);
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

import { describe, expect, it } from 'vitest';

import {
  getAppProtocolBanner,
  getAppProtocolEntryUrl,
} from '../src/app-protocol';

describe('app-protocol', () => {
  it('builds entry URLs on the app scheme', () => {
    expect(getAppProtocolEntryUrl('main_window')).toEqual(
      'app://main_window/index.html',
    );
  });

  it('emits syntactically valid runtime code', () => {
    const banner = getAppProtocolBanner(['main_window', 'second_window']);
    // Throws on a syntax error without executing the code.
    expect(() => new Function(banner)).not.toThrow();
    expect(banner).toContain('["main_window","second_window"]');
  });

  it('registers additional privileged schemes alongside app', () => {
    const banner = getAppProtocolBanner(
      ['main_window'],
      [{ scheme: 'media', privileges: { stream: true, bypassCSP: true } }],
    );
    expect(() => new Function(banner)).not.toThrow();
    // A single registerSchemesAsPrivileged call containing both schemes, with
    // the app scheme first.
    const registrations = banner.match(/registerSchemesAsPrivileged/g);
    expect(registrations).toHaveLength(1);
    expect(banner).toMatch(/"scheme":"app".*"scheme":"media"/s);
    expect(banner).toContain('"bypassCSP":true');
  });

  it('throws when an additional scheme conflicts with the app scheme', () => {
    expect(() =>
      getAppProtocolBanner(['main_window'], [{ scheme: 'APP' }]),
    ).toThrow(/reserved/);
  });
});

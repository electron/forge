import { describe, expect, it } from 'vitest';

import {
  getAppProtocolBanner,
  getAppProtocolEntryUrl,
  resolveAppProtocolConfig,
} from '../src/app-protocol';

describe('app-protocol', () => {
  it('builds entry URLs on the app scheme by default', () => {
    expect(getAppProtocolEntryUrl('main_window')).toEqual(
      'app://main_window/index.html',
    );
  });

  it('builds entry URLs on a custom scheme', () => {
    expect(getAppProtocolEntryUrl('main_window', 'myapp')).toEqual(
      'myapp://main_window/index.html',
    );
  });

  it('emits syntactically valid runtime code', () => {
    const banner = getAppProtocolBanner(['main_window', 'second_window']);
    // Throws on a syntax error without executing the code.
    expect(() => new Function(banner)).not.toThrow();
    expect(banner).toContain('["main_window","second_window"]');
  });

  it('registers and handles a custom scheme', () => {
    const banner = getAppProtocolBanner(['main_window'], { scheme: 'myapp' });
    expect(() => new Function(banner)).not.toThrow();
    expect(banner).toContain('"scheme":"myapp"');
    expect(banner).toContain('protocol.handle("myapp"');
    expect(banner).not.toContain('"scheme":"app"');
  });

  it('registers additional privileged schemes alongside the serving scheme', () => {
    const banner = getAppProtocolBanner(['main_window'], {
      additionalPrivilegedSchemes: [
        { scheme: 'media', privileges: { stream: true, bypassCSP: true } },
      ],
    });
    expect(() => new Function(banner)).not.toThrow();
    // A single registerSchemesAsPrivileged call containing both schemes, with
    // the serving scheme first.
    const registrations = banner.match(/registerSchemesAsPrivileged/g);
    expect(registrations).toHaveLength(1);
    expect(banner).toMatch(/"scheme":"app".*"scheme":"media"/s);
    expect(banner).toContain('"bypassCSP":true');
  });

  it('throws when an additional scheme conflicts with the serving scheme', () => {
    expect(() =>
      getAppProtocolBanner(['main_window'], {
        additionalPrivilegedSchemes: [{ scheme: 'APP' }],
      }),
    ).toThrow(/reserved/);
    expect(() =>
      resolveAppProtocolConfig({
        scheme: 'myapp',
        additionalPrivilegedSchemes: [{ scheme: 'myapp' }],
      }),
    ).toThrow(/reserved/);
  });

  it('allows app as an additional scheme when the serving scheme differs', () => {
    const { additionalPrivilegedSchemes } = resolveAppProtocolConfig({
      scheme: 'myapp',
      additionalPrivilegedSchemes: [{ scheme: 'app' }],
    });
    expect(additionalPrivilegedSchemes).toEqual([{ scheme: 'app' }]);
  });

  it.each(['MyApp', '1app', 'my app', 'my_app', ''])(
    'rejects the syntactically invalid scheme %j',
    (scheme) => {
      expect(() => resolveAppProtocolConfig({ scheme })).toThrow(
        /valid lowercase URI scheme/,
      );
    },
  );

  it.each(['http', 'https', 'file', 'devtools', 'chrome'])(
    'rejects the reserved scheme %j',
    (scheme) => {
      expect(() => resolveAppProtocolConfig({ scheme })).toThrow(
        /already claimed/,
      );
    },
  );

  it('accepts RFC 3986 scheme characters', () => {
    expect(resolveAppProtocolConfig({ scheme: 'my-app.v2+x' }).scheme).toEqual(
      'my-app.v2+x',
    );
  });

  it('resolves the boolean form to the defaults', () => {
    expect(resolveAppProtocolConfig(true)).toEqual({
      scheme: 'app',
      additionalPrivilegedSchemes: [],
    });
  });
});

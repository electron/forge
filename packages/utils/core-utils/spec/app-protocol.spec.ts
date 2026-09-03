import { describe, expect, it } from 'vitest';

import {
  APP_PROTOCOL_DEFAULT_PRIVILEGES,
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

  it('builds entry URLs on a custom scheme and entry path', () => {
    expect(getAppProtocolEntryUrl('main_window', 'myapp')).toEqual(
      'myapp://main_window/index.html',
    );
    expect(
      getAppProtocolEntryUrl('main_window', 'app', 'main_window/index.html'),
    ).toEqual('app://main_window/main_window/index.html');
  });

  it('rejects renderer names that cannot be URL hosts', () => {
    expect(() => getAppProtocolEntryUrl('my window')).toThrow(/URL host/);
    expect(() => getAppProtocolBanner(['my window'])).toThrow(/URL host/);
  });

  it('rejects renderer names that collide case-insensitively', () => {
    // URL hosts are case-insensitive, so these would share one origin and
    // the second window would silently be served the first one's files.
    expect(() => getAppProtocolBanner(['MainWindow', 'mainwindow'])).toThrow(
      /same origin/,
    );
  });

  it.each(['1', '2024', '1.2', '0x10'])(
    'rejects the IPv4-canonicalising renderer name %j',
    (name) => {
      // Standard schemes canonicalise IPv4-like hosts (`app://1/` becomes
      // `app://0.0.0.1/`), so these names could never match the handler.
      expect(() => getAppProtocolEntryUrl(name)).toThrow(/URL host/);
    },
  );

  it('rejects disabling standard on the serving scheme', () => {
    expect(() =>
      resolveAppProtocolConfig({ privileges: { standard: false } }),
    ).toThrow(/standard/);
  });

  it('rejects codeCache without standard on additional schemes', () => {
    expect(() =>
      resolveAppProtocolConfig({
        additionalPrivilegedSchemes: [
          { scheme: 'media', privileges: { codeCache: true } },
        ],
      }),
    ).toThrow(/codeCache/);
  });

  it('emits syntactically valid runtime code', () => {
    const banner = getAppProtocolBanner(['main_window', 'second_window']);
    // Throws on a syntax error without executing the code.
    expect(() => new Function(banner)).not.toThrow();
    expect(banner).toContain('["main_window","second_window"]');
  });

  it('keeps strict mode scoped to the runtime and no-ops outside the browser process', () => {
    const banner = getAppProtocolBanner(['main_window']);
    // The directive lives inside the IIFE: a file-level one would force
    // webpack's deliberately-sloppy bundled CJS deps into strict mode (the
    // Vite path re-adds a file-level directive in pluginAppProtocolRuntime,
    // where the banner displaces Rollup's own prologue).
    expect(banner).not.toMatch(/^'use strict';/);
    expect(banner).toMatch(/\(function \(\) \{\s*'use strict';/);
    // Main-target bundles can also be loaded in utility/worker processes,
    // where `app`/`protocol` do not exist.
    expect(banner).toContain(`process.type !== 'browser'`);
  });

  it('serves single-range requests so media can seek', () => {
    const banner = getAppProtocolBanner(['main_window']);
    // net.fetch(file:) drops the Range header (electron/electron#38749);
    // the handler answers ranges from the file directly and advertises
    // Accept-Ranges on full responses.
    expect(() => new Function(banner)).not.toThrow();
    expect(banner).toContain(`request.headers.get('range')`);
    expect(banner).toContain('status: 206');
    expect(banner).toContain('status: 416');
    expect(banner).toContain(`'Accept-Ranges', 'bytes'`);
    // Only known media types take the fs-range path — everything else goes
    // through net.fetch and keeps its sniffed Content-Type instead of
    // getting application/octet-stream.
    expect(banner).toContain('mediaType !== undefined');
    expect(banner).not.toContain('application/octet-stream');
    for (const mediaExtension of ['aac', 'mkv', 'oga', 'weba', 'mp4', 'mp3']) {
      expect(banner).toContain(`${mediaExtension}: '`);
    }
  });

  it('grants the serving scheme secure-origin defaults including stream and codeCache', () => {
    const banner = getAppProtocolBanner(['main_window']);
    expect(banner).toContain(
      '{"scheme":"app","privileges":{"standard":true,"secure":true,"supportFetchAPI":true,"stream":true,"codeCache":true}}',
    );
  });

  it('merges privilege overrides for the serving scheme', () => {
    const { privileges } = resolveAppProtocolConfig({
      privileges: { allowServiceWorkers: true, codeCache: false },
    });
    expect(privileges).toEqual({
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      codeCache: false,
      allowServiceWorkers: true,
    });
  });

  it('only registers schemes when not serving renderers (development)', () => {
    const banner = getAppProtocolBanner(['main_window'], true, {
      serveRenderers: false,
    });
    expect(() => new Function(banner)).not.toThrow();
    expect(banner).toContain('registerSchemesAsPrivileged');
    expect(banner).not.toContain('protocol.handle');
  });

  it('supports a shared renderer root for all origins', () => {
    const perName = getAppProtocolBanner(['main_window']);
    expect(perName).toContain(`'renderer', name`);
    const shared = getAppProtocolBanner(['main_window'], true, {
      rootIncludesName: false,
    });
    expect(shared).toContain(`'..', 'renderer')`);
    expect(shared).not.toContain(`'renderer', name`);
    // With a shared root, '/' must map into the origin's own subdirectory —
    // routers push '/' and reloads request it.
    expect(shared).toContain(`path.join(name, 'index.html')`);
  });

  it('guards traversal without rejecting names that merely start with dots', () => {
    const banner = getAppProtocolBanner(['main_window']);
    // A '..' prefix check alone would 404 a real file named '..manifest.json'.
    expect(banner).toContain(
      `relative === '..' || relative.startsWith('..' + path.sep)`,
    );
  });

  it('fails malformed percent-escapes with a 400 instead of throwing', () => {
    const banner = getAppProtocolBanner(['main_window']);
    // decodeURIComponent throws URIError on e.g. %FF; uncaught, Electron
    // fails the request with ERR_UNEXPECTED instead of a 4xx.
    expect(banner).toMatch(/try \{\s*pathname = decodeURIComponent/);
    expect(banner).toContain('status: 400');
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
      resolveAppProtocolConfig({
        additionalPrivilegedSchemes: [{ scheme: 'app' }],
      }),
    ).toThrow(/reserved/);
    expect(() =>
      resolveAppProtocolConfig({
        scheme: 'myapp',
        additionalPrivilegedSchemes: [{ scheme: 'myapp' }],
      }),
    ).toThrow(/reserved/);
  });

  it('applies scheme syntax validation to additional schemes too', () => {
    for (const scheme of ['', 'My App', 'APP']) {
      expect(() =>
        resolveAppProtocolConfig({
          additionalPrivilegedSchemes: [{ scheme }],
        }),
      ).toThrow(/valid lowercase URI scheme/);
    }
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

  describe('registerSchemes: false', () => {
    it('emits the serving handler but no scheme registration', () => {
      const banner = getAppProtocolBanner(['main_window'], {
        registerSchemes: false,
      });
      expect(() => new Function(banner)).not.toThrow();
      expect(banner).toContain('protocol.handle');
      expect(banner).not.toContain('registerSchemesAsPrivileged');
    });

    it('emits nothing in development', () => {
      // The app owns the registration call and the dev server serves the
      // renderers, so there is nothing left for the runtime to do.
      expect(
        getAppProtocolBanner(
          ['main_window'],
          { registerSchemes: false },
          {
            serveRenderers: false,
          },
        ),
      ).toEqual('');
    });

    it('rejects options that configure the registration Forge no longer makes', () => {
      expect(() =>
        resolveAppProtocolConfig({
          registerSchemes: false,
          additionalPrivilegedSchemes: [{ scheme: 'media' }],
        }),
      ).toThrow(/registerSchemes: false/);
      expect(() =>
        resolveAppProtocolConfig({
          registerSchemes: false,
          privileges: { stream: false },
        }),
      ).toThrow(/registerSchemes: false/);
    });

    it('exports the default serving privileges for app-owned registration', () => {
      expect(APP_PROTOCOL_DEFAULT_PRIVILEGES).toEqual({
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        codeCache: true,
      });
    });
  });

  it('resolves the boolean form to the defaults', () => {
    expect(resolveAppProtocolConfig(true)).toEqual({
      scheme: 'app',
      registerSchemes: true,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        codeCache: true,
      },
      additionalPrivilegedSchemes: [],
    });
  });
});

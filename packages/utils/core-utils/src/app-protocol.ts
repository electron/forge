/**
 * Shared support for the bundler plugins' `appProtocol` option: serving
 * packaged renderer bundles over a privileged custom `app://` scheme instead
 * of `file://`, per Electron's security recommendations (secure origin,
 * working `fetch()` of local resources, origin-scoped storage, etc.).
 *
 * The code returned by {@link getAppProtocolBanner} is prepended to the
 * main-process bundle by the plugin. It must run before the app's `ready`
 * event, hence a banner at the very top of the bundle:
 *
 * - `protocol.registerSchemesAsPrivileged` may only be called once, before
 *   `ready`. It is registered in development builds too, so schemes carry the
 *   same privileges under `electron-forge start` as in the packaged app.
 * - The `protocol.handle` registration (production only — the dev server
 *   serves renderers over HTTP) is attached with `app.once('ready')` from the
 *   banner, which runs before any user code. Listeners fire in registration
 *   order, so the handler is guaranteed to be registered before a
 *   `createWindow()` in the app's own `ready` handler calls
 *   `loadURL('app://...')`.
 *
 * The banner is emitted into every bundle the plugins build for the main
 * process target, which can include utility-process or forked-worker bundles;
 * the runtime no-ops outside the browser process, where `app` and `protocol`
 * do not exist.
 */

export const APP_PROTOCOL_SCHEME = 'app';

/**
 * URI scheme syntax per RFC 3986, restricted to lowercase: Chromium
 * lower-cases schemes at parse time, so an uppercase registration could never
 * match a request.
 */
const SCHEME_SYNTAX = /^[a-z][a-z0-9+.-]*$/;

/**
 * Renderer names become the URL host of a `standard: true` scheme, so when
 * `appProtocol` is enabled they must survive URL parsing (no spaces or other
 * host-invalid characters) to ever match the handler's hostname check.
 */
const RENDERER_NAME_AS_HOST = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?$/;

/**
 * Schemes Chromium or Electron already claim; registering one of these as the
 * serving scheme would clash with built-in handling instead of serving the
 * renderer.
 */
const RESERVED_SCHEMES = new Set([
  'about',
  'blob',
  'chrome',
  'chrome-error',
  'chrome-extension',
  'data',
  'devtools',
  'file',
  'filesystem',
  'ftp',
  'http',
  'https',
  'javascript',
  'mailto',
  'view-source',
  'ws',
  'wss',
]);

/**
 * A custom scheme to register as privileged, structurally compatible with
 * Electron's `CustomScheme` type so values can be shared with app code.
 */
export interface PrivilegedScheme {
  scheme: string;
  privileges?: {
    standard?: boolean;
    secure?: boolean;
    bypassCSP?: boolean;
    allowServiceWorkers?: boolean;
    supportFetchAPI?: boolean;
    corsEnabled?: boolean;
    stream?: boolean;
    codeCache?: boolean;
  };
}

/**
 * Default privileges for the serving scheme. `standard` + `secure` make it a
 * real secure origin, `supportFetchAPI` lets renderer code `fetch()` its own
 * resources, `stream` keeps `<video>`/`<audio>` working (they did under
 * `file://`), and `codeCache` keeps V8 code caching for renderer scripts.
 *
 * Exported so an app that opts out of Forge's registration
 * (`appProtocol: { registerSchemes: false }`) can include the serving
 * scheme with these privileges in its own `registerSchemesAsPrivileged`
 * call.
 */
export const APP_PROTOCOL_DEFAULT_PRIVILEGES: NonNullable<
  PrivilegedScheme['privileges']
> = {
  standard: true,
  secure: true,
  supportFetchAPI: true,
  stream: true,
  codeCache: true,
};

export interface AppProtocolConfig {
  /**
   * The custom scheme the built renderer files are served over.
   *
   * ⚠️ The scheme is part of the renderer's origin (`scheme://renderer-name`),
   * which keys `localStorage`, IndexedDB, service worker registrations, and
   * everything else origin-scoped. Changing it after an app has shipped
   * orphans that data — pick it before the first release and treat a later
   * rename as a data migration.
   *
   * Must be a valid lowercase URI scheme (a letter followed by letters,
   * digits, `+`, `-`, or `.`) that Chromium/Electron do not already claim.
   * @defaultValue 'app'
   */
  scheme?: string;

  /**
   * Privilege overrides for the serving scheme, merged over the defaults
   * (`standard`, `secure`, `supportFetchAPI`, `stream`, and `codeCache`, all
   * `true`). Use this to e.g. enable `allowServiceWorkers` for the renderer's
   * origin — the injected runtime owns the app's single
   * `registerSchemesAsPrivileged` call, so this is the only place to do it.
   */
  privileges?: PrivilegedScheme['privileges'];

  /**
   * Whether the injected runtime makes the app's
   * `protocol.registerSchemesAsPrivileged` call.
   *
   * Set to `false` when your app needs to own that call itself (Electron
   * allows exactly one per app, before `ready`). Forge then injects only the
   * `protocol.handle` serving runtime, and your registration MUST include the
   * serving scheme or the packaged app cannot load its window — spread
   * `APP_PROTOCOL_DEFAULT_PRIVILEGES` (exported from
   * `@electron-forge/core-utils`) or write the equivalent literal:
   *
   * ```js
   * protocol.registerSchemesAsPrivileged([
   *   {
   *     scheme: 'app',
   *     privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, codeCache: true },
   *   },
   *   // ...your own schemes
   * ]);
   * ```
   *
   * `privileges` and `additionalPrivilegedSchemes` are rejected in this mode:
   * both configure a registration call Forge no longer makes.
   * @defaultValue `true`
   */
  registerSchemes?: boolean;

  /**
   * Additional custom schemes to register as privileged alongside the serving
   * scheme.
   *
   * Electron only allows a single `protocol.registerSchemesAsPrivileged` call
   * per app, and the runtime injected by `appProtocol` makes that call. An app
   * that needs its own privileged schemes must therefore declare them here
   * instead of calling `registerSchemesAsPrivileged` itself. The app still
   * registers its own `protocol.handle` for these schemes — Forge only
   * registers their privileges.
   *
   * The serving scheme itself ({@link scheme}, `app` by default) is reserved
   * for Forge's renderer serving and may not appear in this list; to adjust
   * its privileges use {@link privileges}.
   */
  additionalPrivilegedSchemes?: PrivilegedScheme[];
}

export interface ResolvedAppProtocolConfig {
  scheme: string;
  registerSchemes: boolean;
  privileges: NonNullable<PrivilegedScheme['privileges']>;
  additionalPrivilegedSchemes: PrivilegedScheme[];
}

/**
 * Normalizes the `appProtocol` option's boolean/object forms and validates
 * the chosen schemes. Throws (failing the build) rather than emitting a
 * runtime that could never serve a window.
 */
export function resolveAppProtocolConfig(
  appProtocol: boolean | AppProtocolConfig,
): ResolvedAppProtocolConfig {
  const config = typeof appProtocol === 'object' ? appProtocol : {};
  const scheme = config.scheme ?? APP_PROTOCOL_SCHEME;

  if (typeof scheme !== 'string' || !SCHEME_SYNTAX.test(scheme)) {
    throw new Error(
      `\`appProtocol.scheme\` must be a valid lowercase URI scheme (a letter followed by letters, digits, '+', '-', or '.'), got ${JSON.stringify(scheme)}.`,
    );
  }
  if (RESERVED_SCHEMES.has(scheme)) {
    throw new Error(
      `\`appProtocol.scheme\` cannot be '${scheme}' — that scheme is already claimed by Chromium/Electron. Pick a scheme of your own, e.g. 'app'.`,
    );
  }

  const registerSchemes = config.registerSchemes ?? true;
  if (!registerSchemes) {
    // Both options configure the registerSchemesAsPrivileged call, which the
    // app owns in this mode — rejecting them beats silently ignoring them.
    if (config.additionalPrivilegedSchemes?.length) {
      throw new Error(
        '`appProtocol.additionalPrivilegedSchemes` cannot be combined with `registerSchemes: false` — your app owns the `registerSchemesAsPrivileged` call, so register them there.',
      );
    }
    if (config.privileges) {
      throw new Error(
        "`appProtocol.privileges` cannot be combined with `registerSchemes: false` — your app owns the `registerSchemesAsPrivileged` call, so include the serving scheme's privileges there (see `APP_PROTOCOL_DEFAULT_PRIVILEGES`).",
      );
    }
  }

  const additionalPrivilegedSchemes = config.additionalPrivilegedSchemes ?? [];
  for (const additional of additionalPrivilegedSchemes) {
    if (
      typeof additional.scheme !== 'string' ||
      !SCHEME_SYNTAX.test(additional.scheme)
    ) {
      throw new Error(
        `Every \`additionalPrivilegedSchemes\` entry must be a valid lowercase URI scheme (a letter followed by letters, digits, '+', '-', or '.'), got ${JSON.stringify(additional.scheme)}.`,
      );
    }
    if (additional.scheme === scheme) {
      throw new Error(
        `The '${scheme}' scheme is reserved for serving renderer files when \`appProtocol\` is enabled — remove it from \`additionalPrivilegedSchemes\` (use \`appProtocol.privileges\` to adjust its privileges).`,
      );
    }
  }

  const privileges = {
    ...APP_PROTOCOL_DEFAULT_PRIVILEGES,
    ...config.privileges,
  };
  if (registerSchemes) {
    // Host-based renderer matching only works for standard schemes, and
    // Electron rejects the whole registerSchemesAsPrivileged call for
    // codeCache without standard — which would throw at the top of the main
    // bundle instead of failing the build.
    if (privileges.standard !== true) {
      throw new Error(
        '`appProtocol.privileges.standard` cannot be disabled — the serving scheme uses the renderer name as a URL host, which requires a standard scheme.',
      );
    }
    for (const {
      scheme: additionalScheme,
      privileges: additionalPrivileges,
    } of additionalPrivilegedSchemes) {
      if (additionalPrivileges?.codeCache && !additionalPrivileges.standard) {
        throw new Error(
          `\`additionalPrivilegedSchemes\` entry '${additionalScheme}' enables \`codeCache\` without \`standard\` — Electron rejects that registration at app startup.`,
        );
      }
    }
  }

  return {
    scheme,
    registerSchemes,
    privileges,
    additionalPrivilegedSchemes,
  };
}

/**
 * Validates that a renderer entry name can be used as the URL host of the
 * serving scheme. Names with spaces etc. worked under `file://` (and are
 * explicitly handled by the plugins' define naming), but can never load over
 * `appProtocol`.
 */
export function validateRendererNameForAppProtocol(name: string): void {
  // Standard schemes get Chromium's full host canonicalisation, so a name
  // that parses but canonicalises differently (IPv4-like names: '1', '1.2',
  // '0x10' → '0.0.0.16') would never match the handler's hostname check.
  // Round-trip through a special-scheme URL to apply the same rules.
  let canonicalHost = '';
  try {
    canonicalHost = new URL(`http://${name}/`).hostname;
  } catch {
    // Unparseable as a host; rejected below.
  }
  if (
    !RENDERER_NAME_AS_HOST.test(name) ||
    canonicalHost !== name.toLowerCase()
  ) {
    throw new Error(
      `Renderer entry name ${JSON.stringify(name)} cannot be used with \`appProtocol\`: names become the URL host (\`scheme://<name>/\`), so they may only contain letters, digits, '.', '_', and '-', must start and end with a letter or digit, and must not look like an IP address.`,
    );
  }
}

/**
 * Builds the entry URL that the plugins' entry magic constants resolve to in
 * production builds. `entryPath` is relative to the scheme's origin root —
 * `index.html` when the handler roots each origin at that renderer's own
 * output directory (Vite), or `<name>/index.html` when it roots every origin
 * at the shared renderer output directory (webpack).
 *
 * Note: `standard: true` schemes are parsed like `http://`, so the renderer
 * name becomes the URL host and is lower-cased by the URL parser. The runtime
 * handler compensates by matching renderer names case-insensitively.
 */
export function getAppProtocolEntryUrl(
  rendererName: string,
  scheme: string = APP_PROTOCOL_SCHEME,
  entryPath = 'index.html',
): string {
  validateRendererNameForAppProtocol(rendererName);
  return `${scheme}://${rendererName}/${entryPath}`;
}

export interface AppProtocolBannerOptions {
  /**
   * Whether the runtime should serve renderer files (production). When false
   * (development), only the privileged scheme registration is emitted so
   * schemes carry the same privileges as in the packaged app; renderers are
   * served by the dev server.
   */
  serveRenderers?: boolean;
  /**
   * Whether each origin's root includes the renderer name
   * (`../renderer/<name>` — Vite, one output directory per renderer) or all
   * origins share `../renderer` (webpack, one output directory with
   * per-entry subdirectories and `publicPath: '/'`).
   */
  rootIncludesName?: boolean;
}

/**
 * Returns the runtime source injected at the top of the main-process bundle.
 *
 * The emitted code is plain CommonJS because both plugins emit CommonJS
 * main-process bundles. If a user overrides their bundler config to emit ESM,
 * the banner's `require('electron')` would break — `appProtocol` is
 * documented as requiring the default CommonJS output. The strict-mode
 * directive lives inside the IIFE: a file-level one would force webpack's
 * deliberately-sloppy bundled CJS deps strict, while the Vite path (whose
 * Rollup prologue directive this banner displaces) re-adds a file-level
 * directive in `pluginAppProtocolRuntime`.
 */
export function getAppProtocolBanner(
  rendererNames: string[],
  appProtocol: boolean | AppProtocolConfig = true,
  {
    serveRenderers = true,
    rootIncludesName = true,
  }: AppProtocolBannerOptions = {},
): string {
  const { scheme, registerSchemes, privileges, additionalPrivilegedSchemes } =
    resolveAppProtocolConfig(appProtocol);
  const seenHosts = new Map<string, string>();
  for (const name of rendererNames) {
    validateRendererNameForAppProtocol(name);
    // URL hosts are lower-cased by the parser and the handler matches
    // case-insensitively, so names differing only by case share one origin —
    // the second window would silently be served the first one's files.
    const host = name.toLowerCase();
    const clashingName = seenHosts.get(host);
    if (clashingName !== undefined) {
      throw new Error(
        `Renderer entry names ${JSON.stringify(clashingName)} and ${JSON.stringify(name)} cannot both be used with \`appProtocol\`: names become the URL host, which is case-insensitive, so they would resolve to the same origin.`,
      );
    }
    seenHosts.set(host, name);
  }
  // With `registerSchemes: false` the app owns the registration call; in
  // development there is then nothing left for the runtime to do (the dev
  // server serves the renderers).
  if (!registerSchemes && !serveRenderers) {
    return '';
  }
  const privilegedSchemes: PrivilegedScheme[] = [
    { scheme, privileges },
    ...additionalPrivilegedSchemes,
  ];
  const registrationCode = registerSchemes
    ? `
  protocol.registerSchemesAsPrivileged(${JSON.stringify(privilegedSchemes)});`
    : '';
  const handlerCode = !serveRenderers
    ? ''
    : `
  app.once('ready', function () {
    protocol.handle(${JSON.stringify(scheme)}, async function (request) {
      const url = new URL(request.url);
      // The URL host is lower-cased by the parser; renderer names may not be.
      const name = rendererNames.find(function (rendererName) {
        return rendererName.toLowerCase() === url.hostname;
      });
      if (name === undefined) {
        return new Response(null, { status: 404 });
      }
      const root = ${
        rootIncludesName
          ? `path.join(__dirname, '..', 'renderer', name)`
          : `path.join(__dirname, '..', 'renderer')`
      };
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        return new Response(null, { status: 400 });
      }
      const target = path.join(root, pathname === '/' ? ${
        rootIncludesName ? `'index.html'` : `path.join(name, 'index.html')`
      } : pathname);
      // Never serve files from outside the renderer output directory. (A
      // plain prefix check would also reject files named '..something'.)
      const relative = path.relative(root, target);
      if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
        return new Response(null, { status: 404 });
      }
      // net.fetch(file:) does not forward the Range header
      // (electron/electron#38749), which media seeking depends on and
      // \`file://\` supported — serve single-range requests for known media
      // types from the file directly. Everything else goes through net.fetch
      // so it keeps its sniffed Content-Type.
      const mediaTypes = { aac: 'audio/aac', mp4: 'video/mp4', m4v: 'video/mp4', m4a: 'audio/mp4', mkv: 'video/x-matroska', webm: 'video/webm', weba: 'audio/webm', ogg: 'audio/ogg', oga: 'audio/ogg', ogv: 'video/ogg', opus: 'audio/ogg', mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', mov: 'video/quicktime' };
      const mediaType = mediaTypes[path.extname(target).slice(1).toLowerCase()];
      const rangeHeader = request.headers.get('range');
      if (rangeHeader !== null && mediaType !== undefined) {
        let size;
        try {
          size = (await fs.promises.stat(target)).size;
        } catch {
          return new Response(null, { status: 404 });
        }
        // Chromium's media stack only sends single ranges.
        const match = /^bytes=(\\d*)-(\\d*)$/.exec(rangeHeader);
        let start = NaN;
        let end = size - 1;
        if (match && match[1] !== '') {
          start = Number(match[1]);
          if (match[2] !== '') end = Math.min(Number(match[2]), size - 1);
        } else if (match && match[2] !== '') {
          start = Math.max(0, size - Number(match[2]));
        }
        if (Number.isNaN(start) || start > end || start >= size) {
          return new Response(null, {
            status: 416,
            headers: { 'Content-Range': 'bytes */' + size },
          });
        }
        return new Response(
          Readable.toWeb(fs.createReadStream(target, { start: start, end: end })),
          {
            status: 206,
            headers: {
              'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
              'Accept-Ranges': 'bytes',
              'Content-Length': String(end - start + 1),
              'Content-Type': mediaType,
            },
          },
        );
      }
      const response = await net.fetch(pathToFileURL(target).toString(), {
        bypassCustomProtocolHandlers: true,
      });
      // Advertise range support so media elements attempt seeking at all.
      const headers = new Headers(response.headers);
      headers.set('Accept-Ranges', 'bytes');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });
    });
  });`;
  // No file-level 'use strict' here: webpack prepends this string verbatim,
  // and a file-level directive would force every bundled sloppy-mode CJS dep
  // into strict mode (webpack keeps CJS modules sloppy on purpose). The Vite
  // path adds a file-level directive in pluginAppProtocolRuntime instead,
  // because the banner displaces Rollup's own prologue directive there.
  return `// Injected by Electron Forge because \`appProtocol\` is enabled.
// ${registerSchemes ? `Registers the privileged \`${scheme}://\` scheme${serveRenderers ? ' and serves the built renderer files over it' : ''}` : `Serves the built renderer files over the \`${scheme}://\` scheme (registered by the app — \`registerSchemes: false\`)`}
// instead of \`file://\`, per Electron's security recommendations.
(function () {
  'use strict';
  // Main-target bundles can also be loaded in utility/worker processes,
  // where \`app\` and \`protocol\` do not exist.
  if (typeof process === 'undefined' || process.type !== 'browser') return;
  if (globalThis.__electronForgeAppProtocol) return;
  globalThis.__electronForgeAppProtocol = true;
  const { app, net, protocol } = require('electron');
  const fs = require('node:fs');
  const path = require('node:path');
  const { Readable } = require('node:stream');
  const { pathToFileURL } = require('node:url');
  const rendererNames = ${JSON.stringify(rendererNames)};${registrationCode}${handlerCode}
})();
`;
}

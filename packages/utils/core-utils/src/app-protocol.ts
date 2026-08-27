/**
 * Shared support for the bundler plugins' `appProtocol` option: serving
 * packaged renderer bundles over a privileged custom `app://` scheme instead
 * of `file://`, per Electron's security recommendations (secure origin,
 * working `fetch()` of local resources, origin-scoped storage, etc.).
 *
 * The code returned by {@link getAppProtocolBanner} is prepended to the
 * production main-process bundle by the plugin (a Rollup banner for Vite, a
 * raw `BannerPlugin` banner for webpack). It must run before the app's
 * `ready` event, hence a banner at the very top of the bundle:
 *
 * - `protocol.registerSchemesAsPrivileged` may only be called once, before
 *   `ready`.
 * - The `protocol.handle` registration is attached with `app.once('ready')`
 *   from the banner, which runs before any user code. Listeners fire in
 *   registration order, so the handler is guaranteed to be registered before
 *   a `createWindow()` in the app's own `ready` handler calls
 *   `loadURL('app://...')`.
 *
 * Both plugins emit main-process bundles laid out as `<out>/main-bundle.js`
 * with renderers in `<out>/../renderer/<name>/`, which is the layout the
 * runtime's `__dirname`-relative lookup assumes.
 */

export const APP_PROTOCOL_SCHEME = 'app';

/**
 * URI scheme syntax per RFC 3986, restricted to lowercase: Chromium
 * lower-cases schemes at parse time, so an uppercase registration could never
 * match a request.
 */
const SCHEME_SYNTAX = /^[a-z][a-z0-9+.-]*$/;

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
    supportFetchApi?: boolean;
    corsEnabled?: boolean;
    stream?: boolean;
    codeCache?: boolean;
  };
}

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
   * for Forge's renderer serving and may not appear in this list.
   */
  additionalPrivilegedSchemes?: PrivilegedScheme[];
}

export interface ResolvedAppProtocolConfig {
  scheme: string;
  additionalPrivilegedSchemes: PrivilegedScheme[];
}

/**
 * Normalizes the `appProtocol` option's boolean/object forms and validates
 * the chosen scheme. Throws (failing the build) rather than emitting a
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

  const additionalPrivilegedSchemes = config.additionalPrivilegedSchemes ?? [];
  for (const additional of additionalPrivilegedSchemes) {
    if (
      typeof additional.scheme !== 'string' ||
      additional.scheme.toLowerCase() === scheme
    ) {
      throw new Error(
        `The '${scheme}' scheme is reserved for serving renderer files when \`appProtocol\` is enabled — remove it from \`additionalPrivilegedSchemes\` (schemes must be non-empty strings).`,
      );
    }
  }

  return { scheme, additionalPrivilegedSchemes };
}

/**
 * Builds the `<scheme>://<renderer-name>/<file>` entry URL that the plugins'
 * entry magic constants resolve to in production builds.
 *
 * Note: `standard: true` schemes are parsed like `http://`, so the renderer
 * name becomes the URL host and is lower-cased by the URL parser. The runtime
 * handler compensates by matching renderer names case-insensitively.
 */
export function getAppProtocolEntryUrl(
  rendererName: string,
  scheme: string = APP_PROTOCOL_SCHEME,
): string {
  return `${scheme}://${rendererName}/index.html`;
}

/**
 * Returns the runtime source injected at the top of the production
 * main-process bundle.
 *
 * The emitted code is plain CommonJS because both plugins emit CommonJS
 * main-process bundles. If a user overrides their bundler config to emit ESM,
 * the banner's `require('electron')` would break — `appProtocol` is
 * documented as requiring the default CommonJS output.
 */
export function getAppProtocolBanner(
  rendererNames: string[],
  appProtocol: boolean | AppProtocolConfig = true,
): string {
  const { scheme, additionalPrivilegedSchemes } =
    resolveAppProtocolConfig(appProtocol);
  const privilegedSchemes: PrivilegedScheme[] = [
    {
      scheme,
      privileges: { standard: true, secure: true, supportFetchApi: true },
    },
    ...additionalPrivilegedSchemes,
  ];
  return `// Injected by Electron Forge because \`appProtocol\` is enabled.
// Serves the built renderer files over the privileged \`${scheme}://\` scheme instead
// of \`file://\`, per Electron's security recommendations.
(function () {
  'use strict';
  if (globalThis.__electronForgeAppProtocol) return;
  globalThis.__electronForgeAppProtocol = true;
  const { app, net, protocol } = require('electron');
  const path = require('node:path');
  const { pathToFileURL } = require('node:url');
  const rendererNames = ${JSON.stringify(rendererNames)};
  protocol.registerSchemesAsPrivileged(${JSON.stringify(privilegedSchemes)});
  app.once('ready', function () {
    protocol.handle(${JSON.stringify(scheme)}, function (request) {
      const url = new URL(request.url);
      // The URL host is lower-cased by the parser; renderer names may not be.
      const name = rendererNames.find(function (rendererName) {
        return rendererName.toLowerCase() === url.hostname;
      });
      if (name === undefined) {
        return new Response(null, { status: 404 });
      }
      const root = path.join(__dirname, '..', 'renderer', name);
      const target = path.join(
        root,
        url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname)
      );
      // Never serve files from outside the renderer output directory.
      const relative = path.relative(root, target);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return new Response(null, { status: 404 });
      }
      return net.fetch(pathToFileURL(target).toString(), {
        bypassCustomProtocolHandlers: true,
      });
    });
  });
})();
`;
}

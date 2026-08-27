/**
 * Support for serving packaged renderer bundles over a privileged custom
 * `app://` scheme instead of `file://`, per Electron's security
 * recommendations (secure origin, working `fetch()` of local resources,
 * origin-scoped storage, etc.).
 *
 * When `appProtocol` is enabled in the plugin config, the code returned by
 * {@link getAppProtocolBanner} is prepended to the production main-process
 * bundle. It must run before the app's `ready` event, so it is injected as a
 * Rollup banner at the very top of the bundle:
 *
 * - `protocol.registerSchemesAsPrivileged` may only be called once, before
 *   `ready`.
 * - The `protocol.handle` registration is attached with `app.once('ready')`
 *   from the banner, which runs before any user code. Listeners fire in
 *   registration order, so the handler is guaranteed to be registered before
 *   a `createWindow()` in the app's own `ready` handler calls
 *   `loadURL('app://...')`.
 */

export const APP_PROTOCOL_SCHEME = 'app';

/**
 * Builds the `app://<renderer-name>/<file>` entry URL that the
 * `*_VITE_ENTRY` define resolves to in production builds.
 *
 * Note: `standard: true` schemes are parsed like `http://`, so the renderer
 * name becomes the URL host and is lower-cased by the URL parser. The runtime
 * handler compensates by matching renderer names case-insensitively.
 */
export function getAppProtocolEntryUrl(rendererName: string): string {
  return `${APP_PROTOCOL_SCHEME}://${rendererName}/index.html`;
}

/**
 * Returns the runtime source injected at the top of the production
 * main-process bundle.
 *
 * The emitted code is plain CommonJS because the plugin builds main-process
 * targets with `formats: ['cjs']`. If a user overrides `build.lib` to emit
 * ESM, the banner's `require('electron')` would break — `appProtocol` is
 * documented as requiring the default CJS output.
 */
export function getAppProtocolBanner(rendererNames: string[]): string {
  return `// Injected by @electron-forge/plugin-vite because \`appProtocol\` is enabled.
// Serves the built renderer files over the privileged \`${APP_PROTOCOL_SCHEME}://\` scheme instead
// of \`file://\`, per Electron's security recommendations.
(function () {
  'use strict';
  if (globalThis.__electronForgeViteAppProtocol) return;
  globalThis.__electronForgeViteAppProtocol = true;
  const { app, net, protocol } = require('electron');
  const path = require('node:path');
  const { pathToFileURL } = require('node:url');
  const rendererNames = ${JSON.stringify(rendererNames)};
  protocol.registerSchemesAsPrivileged([
    {
      scheme: '${APP_PROTOCOL_SCHEME}',
      privileges: { standard: true, secure: true, supportFetchApi: true },
    },
  ]);
  app.once('ready', function () {
    protocol.handle('${APP_PROTOCOL_SCHEME}', function (request) {
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

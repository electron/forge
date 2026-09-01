import type { AppProtocolConfig } from '@electron-forge/core-utils';
import { Configuration as RawWebpackConfiguration } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import { ConfigurationFactory as WebpackConfigurationFactory } from './WebpackConfig.js';

export interface WebpackPluginEntryPointBase {
  /**
   * Human friendly name of your entry point
   */
  name: string;
  /**
   * Additional entries to put in the array of entries for this entry point,
   * useful if you need to set up things like error reporting as separate
   * entry files into your application.
   */
  prefixedEntries?: string[];
  /**
   * Additional chunks to include in the outputted HTML file. Use this if you
   * set up some custom chunking (e.g. using SplitChunksPlugin).
   */
  additionalChunks?: string[];
  /**
   * Override the webpack config for this renderer based on whether `nodeIntegration` for
   * the `BrowserWindow` is enabled. For webpack's `target` option:
   *
   * * When `nodeIntegration` is true, the `target` is `electron-renderer`.
   * * When `nodeIntegration` is false, the `target` is `web`.
   *
   * Unfortunately, we cannot derive the value from the main process code as it can be
   * dynamically generated at run-time, and webpack processes at build-time.
   *
   * Defaults to `false` (as it is disabled by default in Electron \>= 5) or the value set
   * for all entries.
   */
  nodeIntegration?: boolean;
}

export interface WebpackPluginEntryPointLocalWindow extends WebpackPluginEntryPointBase {
  /**
   * Relative or absolute path to the HTML template file for this entry point.
   */
  html: string;
  /**
   * Relative or absolute path to the main JS file for this entry point.
   */
  js: string;
  /**
   * Information about the preload script for this entry point. If you don't use
   * preload scripts, you don't need to set this.
   */
  preload?: WebpackPreloadEntryPoint;
}

export interface WebpackPluginEntryPointPreloadOnly extends WebpackPluginEntryPointBase {
  /**
   * Information about the preload script for this entry point.
   */
  preload: WebpackPreloadEntryPoint;
}

export interface WebpackPluginEntryPointNoWindow extends WebpackPluginEntryPointBase {
  /**
   * Relative or absolute path to the main JS file for this entry point.
   */
  js: string;
}

export type WebpackPluginEntryPoint =
  | WebpackPluginEntryPointLocalWindow
  | WebpackPluginEntryPointNoWindow
  | WebpackPluginEntryPointPreloadOnly;

export interface WebpackPreloadEntryPoint {
  /**
   * Relative or absolute path to the preload JS file.
   */
  js: string;
  /**
   * Additional entries to put in the array of entries for this preload script,
   * useful if you need to set up things like error reporting as separate
   * entry files into your application.
   */
  prefixedEntries?: string[];
  /**
   * The optional webpack config for your preload process.
   * Defaults to the renderer webpack config if blank.
   */
  config?: WebpackConfiguration | string;
}

export interface WebpackPluginRendererConfig {
  /**
   * The webpack config for your renderer process
   */
  config: WebpackConfiguration | string;
  /**
   * Instructs webpack to emit a JSON file containing statistics about modules, the dependency
   * graph, and various other build information for the renderer process during the app
   * packaging process. This file is located in `.webpack/renderer/stats.json`, but is not
   * actually packaged with your app.
   */
  jsonStats?: boolean;
  /**
   * Override the webpack config for this renderer based on whether `nodeIntegration` for
   * the `BrowserWindow` is enabled. For webpack's `target` option:
   *
   * * When `nodeIntegration` is true, the `target` is `electron-renderer`.
   * * When `nodeIntegration` is false, the `target` is `web`.
   *
   * Unfortunately, we cannot derive the value from the main process code as it can be
   * dynamically generated at run-time, and webpack processes at build-time.
   *
   * Defaults to `false` (as it is disabled by default in Electron \>= 5).
   */
  nodeIntegration?: boolean;
  /**
   * Array of entry points, these should map to the windows your app needs to
   * open.  Each window requires it's own entry point
   */
  entryPoints: WebpackPluginEntryPoint[];
}

export interface EntryPointPluginConfig {
  name: string;
}

export interface WebpackPluginConfig {
  /**
   * The webpack config for your main process
   */
  mainConfig: WebpackConfiguration | string;
  /**
   * Instructs webpack to emit a JSON file containing statistics about modules, the dependency
   * graph, and various other build information for the main process. This file is located in
   * `.webpack/main/stats.json`, but is not packaged with your app.
   */
  jsonStats?: boolean;
  /**
   * Electron Forge webpack configuration for your renderer process
   *
   * If this property is configured as an array each group of entryPoints is built sequentially
   * such that later indexed renderer configurations can depend on the output of previous ones.
   *
   * If you want to build multiple targets in parallel please specify multiple entryPoints in a
   * single renderer configuration. Most usecases should not set this to an array.
   */
  renderer: WebpackPluginRendererConfig | WebpackPluginRendererConfig[];
  /**
   * Serve the built renderer files over a privileged `app://` custom scheme in
   * packaged apps instead of loading them from `file://`, per Electron's
   * security recommendations. See
   * https://www.electronjs.org/docs/latest/api/protocol
   *
   * When enabled, the plugin injects the scheme registration and protocol
   * handler into the production main-process bundle, and the `*_WEBPACK_ENTRY`
   * magic constant for HTML entry points resolves to an
   * `app://<entry-name>/<entry-name>/index.html` URL in production (every
   * origin is rooted at the shared renderer output directory, so the path
   * carries the per-entry subdirectory; it is a dev server URL in development
   * either way, so `mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)` keeps
   * working unchanged). JS-only (no-window) entry points and
   * `nodeIntegration: true` entry points keep their `file://` paths —
   * Electron only derives the renderer's `__dirname` from `file:` URLs, which
   * relocated native modules rely on.
   *
   * Notes:
   * - `protocol.registerSchemesAsPrivileged` can only be called once per app,
   *   and the injected runtime makes that call. If your app needs its own
   *   privileged schemes, pass them via the object form's
   *   `additionalPrivilegedSchemes` instead of calling
   *   `registerSchemesAsPrivileged` yourself.
   * - The object form's `registerSchemes: false` hands the
   *   `registerSchemesAsPrivileged` call to your app instead — Forge then
   *   injects only the serving handler, and your registration must include
   *   the serving scheme (see `APP_PROTOCOL_DEFAULT_PRIVILEGES` in
   *   `@electron-forge/core-utils`).
   * - The object form's `scheme` renames the serving scheme (default `app`).
   *   The scheme is part of the renderer's origin, so pick it before the
   *   first release — renaming later orphans origin-scoped data such as
   *   `localStorage` and IndexedDB.
   * - Requires the default CommonJS output for the main-process bundle.
   * @defaultValue `false`
   */
  appProtocol?: boolean | AppProtocolConfig;

  /**
   * The TCP port for the dev servers. Defaults to 3000.
   */
  port?: number;
  /**
   * The TCP port for web-multi-logger. Defaults to 9000.
   */
  loggerPort?: number;
  /**
   * In the event that webpack has been configured with `devtool: sourcemap` (or any other option
   * which results in `.map` files being generated), this option will cause the source map files be
   * packaged with your app. By default they are not included.
   */
  packageSourceMaps?: boolean;
  /**
   * Sets the [`Content-Security-Policy` header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
   * for the Webpack development server.
   *
   * Normally you would want to only specify this as a `<meta>` tag. However, in development mode,
   * the Webpack plugin uses the `devtool: eval-source-map` source map setting for efficiency
   * purposes. This requires the `'unsafe-eval'` source for the `script-src` directive that wouldn't
   * normally be recommended to use. If this value is set, make sure that you keep this
   * directive-source pair intact if you want to use source maps.
   *
   * Default: `default-src 'self' 'unsafe-inline' data:;`
   * `script-src 'self' 'unsafe-eval' 'unsafe-inline' data:`
   */
  devContentSecurityPolicy?: string;
  /**
   * Overrides for [`webpack-dev-server`](https://webpack.js.org/configuration/dev-server/) options.
   *
   * The following options cannot be overridden here:
   * * `port` (use the `port` config option)
   * * `static`
   * * `setupExitSignals`
   * * `headers.Content-Security-Policy` (use the `devContentSecurityPolicy` config option)
   */
  devServer?: Omit<
    WebpackDevServer.Configuration,
    'port' | 'static' | 'setupExitSignals' | 'Content-Security-Policy'
  >;
}

export type WebpackConfiguration =
  | RawWebpackConfiguration
  | WebpackConfigurationFactory;

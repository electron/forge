import type { LibraryOptions } from 'vite';

export interface VitePluginBuildConfig {
  /**
   * Alias of `build.lib.entry` in `config`.
   */
  entry: LibraryOptions['entry'];
  /**
   * Vite config file path.
   */
  config: string;
  /**
   * The build target is main process or preload script.
   * @defaultValue 'main'
   */
  target?: 'main' | 'preload';
}

export interface VitePluginRendererConfig {
  /**
   * Human friendly name of your entry point.
   */
  name: string;
  /**
   * Vite config file path.
   */
  config: string;
}

/**
 * A custom scheme to register as privileged, structurally compatible with
 * Electron's `CustomScheme` type so values can be shared with app code.
 */
export interface VitePluginPrivilegedScheme {
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

export interface VitePluginAppProtocolConfig {
  /**
   * Additional custom schemes to register as privileged alongside `app://`.
   *
   * Electron only allows a single `protocol.registerSchemesAsPrivileged` call
   * per app, and the runtime injected by `appProtocol` makes that call. An app
   * that needs its own privileged schemes must therefore declare them here
   * instead of calling `registerSchemesAsPrivileged` itself. The app still
   * registers its own `protocol.handle` for these schemes — Forge only
   * registers their privileges.
   *
   * The `app` scheme itself is reserved for Forge's renderer serving and may
   * not appear in this list.
   */
  additionalPrivilegedSchemes?: VitePluginPrivilegedScheme[];
}

export interface VitePluginConfig {
  // Reserved option, may support modification in the future.
  // @defaultValue '.vite'
  // baseDir?: string;

  /**
   * Build anything such as Main process, Preload scripts and Worker process, etc.
   */
  build: VitePluginBuildConfig[];
  /**
   * Renderer process Vite configs.
   */
  renderer: VitePluginRendererConfig[];

  /**
   * Run builds concurrently. If a boolean is provided, targets specified in the {@link build} and {@link renderer}
   * configurations will be run concurrently. If a number is provided, it will limit the number of concurrent builds.
   *
   * Limit concurrency if you are running into memory constraints when packaging.
   * @defaultValue `true`
   */
  concurrent?: boolean | number;

  /**
   * Serve the built renderer files over a privileged `app://` custom scheme in
   * packaged apps instead of loading them from `file://`, per Electron's
   * security recommendations. See
   * https://www.electronjs.org/docs/latest/api/protocol
   *
   * When enabled, the plugin injects the scheme registration and protocol
   * handler into the production main-process bundle, and the `*_VITE_ENTRY`
   * magic constant resolves to the Vite dev server URL in development and an
   * `app://<renderer-name>/index.html` URL in production, so the main process
   * can unconditionally call `mainWindow.loadURL(MAIN_WINDOW_VITE_ENTRY)`.
   *
   * Notes:
   * - `protocol.registerSchemesAsPrivileged` can only be called once per app,
   *   and the injected runtime makes that call. If your app needs its own
   *   privileged schemes, pass them via the object form's
   *   {@link VitePluginAppProtocolConfig.additionalPrivilegedSchemes} instead
   *   of calling `registerSchemesAsPrivileged` yourself.
   * - Requires the default CommonJS output for main-process targets.
   * @defaultValue `false`
   */
  appProtocol?: boolean | VitePluginAppProtocolConfig;
}

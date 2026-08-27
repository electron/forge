import type { AppProtocolConfig } from '@electron-forge/core-utils';
import type { LibraryOptions } from 'vite';

export type VitePluginAppProtocolConfig = AppProtocolConfig;

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

  /**
   * Restart the running app whenever the main process bundle is rebuilt during
   * `electron-forge start`. Has no effect when packaging.
   * @defaultValue `false`
   */
  hotRestart?: boolean;
}

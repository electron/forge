import { Configuration as RawRspackConfiguration } from '@rspack/core';
import { Configuration as RspackDevServerConfiguration } from '@rspack/dev-server';

export type RspackConfigurationFactory = (
  env: string | Record<string, string | boolean | number> | unknown,
  args: Record<string, unknown>
) => RspackConfiguration | Promise<RspackConfiguration>;

export type RspackConfiguration = RawRspackConfiguration | RspackConfigurationFactory;

export interface RspackPreloadEntryPoint {
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
  config?: RspackConfiguration | string;
}

export interface RspackPluginEntryPointBase {
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

export interface RspackPluginEntryPointLocalWindow extends RspackPluginEntryPointBase {
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
  preload?: RspackPreloadEntryPoint;
}

export interface RspackPluginEntryPointPreloadOnly extends RspackPluginEntryPointBase {
  /**
   * Information about the preload script for this entry point.
   */
  preload: RspackPluginEntryPoint;
}

export interface RspackPluginEntryPointNoWindow extends RspackPluginEntryPointBase {
  /**
   * Relative or absolute path to the main JS file for this entry point.
   */
  js: string;
}

export type RspackPluginEntryPoint = RspackPluginEntryPointLocalWindow | RspackPluginEntryPointNoWindow | RspackPluginEntryPointPreloadOnly;

export interface RspackPluginConfig {
  /**
   * The webpack config for your main process
   */
  mainConfig: RspackConfiguration | string;
  renderer: RspackPluginRendererConfig | RspackPluginRendererConfig[];
  /**
   * The TCP port for the dev servers.
   * @defaultValue 3000
   */
  port?: number;
  /**
   * The TCP port for web-multi-logger.
   * @defaultValue 9000
   */
  loggerPort?: number;
  devContentSecurityPolicy?: string;
  devServer?: Omit<RspackDevServerConfiguration, 'port' | 'static' | 'setupExitSignals' | 'Content-Security-Policy'>;
  jsonStats?: boolean;
  packageSourceMaps?: boolean;
}

export interface RspackPluginRendererConfig {
  /**
   * The rspack config for your renderer process
   */
  config: RspackConfiguration | string;
  jsonStats?: boolean;
  nodeIntegration?: boolean;
  entryPoints: RspackPluginEntryPoint[];
}

export interface EntryPointPluginConfig {
  name: string;
}

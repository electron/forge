import type { LibraryOptions } from 'vite';

export interface NativeModulesConfig {
  /**
   * Package names to always treat as native. They are externalized from the
   * Vite bundle and copied (with their transitive dependencies) into the
   * packaged app, even if automatic detection misses them.
   */
  include?: string[];
  /**
   * Package names to remove from the automatically detected set. They are
   * bundled by Vite like any other JavaScript dependency.
   */
  exclude?: string[];
}

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
   * Manual overrides for native Node module detection.
   *
   * The plugin automatically detects native modules, externalizes them from
   * the Vite bundle, and copies them (along with their transitive
   * dependencies) into the packaged app. Use `include` to force packages into
   * that set when detection misses them, and `exclude` to remove detected
   * packages so they are bundled by Vite instead.
   */
  nativeModules?: NativeModulesConfig;
}

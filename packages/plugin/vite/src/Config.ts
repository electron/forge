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
   * The module type to use for the main process and preload script builds.
   *
   * - `'commonjs'` outputs CJS bundles (the default, matching Electron's traditional module system).
   * - `'module'` outputs ES module bundles. When using this option, make sure your `package.json`
   *    has `"type": "module"` and that your Electron version supports ESM (Electron >= 28).
   *
   * @defaultValue `'commonjs'`
   * @see https://www.electronjs.org/docs/latest/tutorial/esm
   */
  type?: 'commonjs' | 'module';
}

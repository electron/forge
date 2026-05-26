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
  /**
   * Override the Vite config for this renderer based on whether `nodeIntegration`
   * for the `BrowserWindow` is enabled.
   *
   * When true, Electron and Node.js built-in modules are externalized and Vite
   * resolves package entry points using Node-oriented conditions and main fields.
   *
   * Unfortunately, Forge cannot derive the value from the main process code as it
   * can be dynamically generated at run-time, while Vite processes at build-time.
   *
   * Defaults to `false` (as it is disabled by default in Electron >= 5).
   */
  nodeIntegration?: boolean;
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
}

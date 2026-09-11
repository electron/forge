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
   * Installs the [Devtron](https://github.com/electron/devtron) DevTools
   * extension into your app while running `electron-forge start`.
   *
   * Requires `@electron/devtron` to be installed as a devDependency of your
   * app and Electron >= 36. The extension is only injected in development;
   * packaged builds are never affected.
   *
   * @defaultValue false
   */
  devtron?: boolean;

  /**
   * Restart the running app whenever the main process bundle is rebuilt during
   * `electron-forge start`. Has no effect when packaging.
   * @defaultValue `false`
   */
  hotRestart?: boolean;
}

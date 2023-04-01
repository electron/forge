import type { LibraryOptions } from 'vite';

export interface VitePluginBuildConfig {
  /**
   * Alias of `build.lib.entry` in `config`.
   */
  entry?: LibraryOptions['entry'];
  /**
   * Vite config file path.
   */
  config?: string;
  /**
   * By default, when any entry in `build` is rebuilt it will restart the Electron App.
   * If you want to customize this behavior, you can pass a function and control it with the `args.restart` provided by the function.
   */
  restart?:
    | false
    | ((args: {
        /**
         * Restart the entire Electron App.
         */
        restart: () => void;
        /**
         * When a Preload script is rebuilt, users can refresh the Renderer process by `ViteDevServer` instead of restart the entire Electron App.
         *
         * @example
         * ```ts
         * renderer.find(({ config }) => config.name === 'main_window').reload();
         * ```
         */
        renderer: {
          config: VitePluginRendererConfig;
          reload: () => void;
        }[];
      }) => void);
}

export interface VitePluginRendererConfig {
  /**
   * Human friendly name of your entry point
   */
  name: string;
  /**
   * Vite config file path.
   */
  config: string;
}

export interface VitePluginConfig {
  /**
   * Build anything such as Main process, Preload scripts and Worker process, etc.
   */
  build: VitePluginBuildConfig[];
  /**
   * Renderer process.
   */
  renderer: VitePluginRendererConfig[];
}

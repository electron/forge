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

export interface VitePluginBuildConfig {
  /**
   * Vite config file path.
   */
  config: string;
}

export interface VitePluginRendererConfig {
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

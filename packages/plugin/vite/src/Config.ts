import type { BuildOptions, InlineConfig, LibraryOptions, ServerOptions } from 'vite';

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

/**
 * @see https://github.com/vitejs/vite/blob/v4.0.4/packages/vite/src/node/cli.ts#L93-L100
 */
export interface VitePluginRendererGlobalConfig extends Pick<InlineConfig, 'base' | 'logLevel' | 'clearScreen' | 'mode'> {
  /**
   * use specified config file
   */
  config?: string;
  /**
   * show debug logs
   */
  debug?: boolean | string;
  /**
   * filter debug logs
   */
  filter?: string;
  /**
   * force the optimizer to ignore the cache and re-bundle
   */
  force?: boolean;
}
export type VitePluginRendererServeConfig = Pick<ServerOptions, 'host' | 'port' | 'https' | 'open' | 'cors' | 'strictPort'>;
export type VitePluginRendererBuildConfig = Pick<
  BuildOptions,
  'target' | 'outDir' | 'assetsDir' | 'assetsInlineLimit' | 'sourcemap' | 'minify' | 'manifest' | 'emptyOutDir' | 'watch'
>;
/**
 * @see https://vitejs.dev/guide/cli.html#options
 */
export type VitePluginRendererConfig = VitePluginRendererGlobalConfig & VitePluginRendererServeConfig & VitePluginRendererBuildConfig;

export interface VitePluginConfig {
  /**
   * Build anything such as Main process, Preload scripts and Worker process, etc.
   */
  build: VitePluginBuildConfig[];
  CLIOptions?: VitePluginRendererConfig;
}

import type { LibraryOptions, LogLevel } from 'vite';

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

export interface VitePluginConfig {
  /**
   * Build anything such as Main process, Preload scripts and Worker process, etc.
   */
  build: VitePluginBuildConfig[];
  /**
   * Vite's CLI Options, for serve and build.
   * @see https://vitejs.dev/guide/cli.html
   */
  CLIOptions?: {
    // global - https://github.com/vitejs/vite/blob/v4.0.4/packages/vite/src/node/cli.ts#L93-L100
    /**
     * use specified config file
     */
    config?: string;
    /**
     * public base path
     * @default '/'
     */
    base?: string;
    /**
     * @default 'info'
     */
    logLevel?: LogLevel;
    /**
     * allow/disable clear screen when logging
     * @default true
     */
    clearScreen?: boolean;
    /**
     * show debug logs
     */
    debug?: boolean | string;
    /**
     * filter debug logs
     */
    filter?: string;
    /**
     * set env mode
     */
    mode?: string;
    /**
     * force the optimizer to ignore the cache and re-bundle (experimental)
     */
    force?: boolean;

    // serve - https://github.com/vitejs/vite/blob/v4.0.4/packages/vite/src/node/cli.ts#L102-L116
    /**
     * specify hostname
     */
    host?: string;
    /**
     * specify port
     */
    port?: number;
    /**
     * use TLS + HTTP/2
     */
    https?: boolean;
    /**
     * open browser on startup
     */
    open?: boolean | string;
    /**
     * enable CORS
     */
    cors?: boolean;
    /**
     * exit if specified port is already in use
     */
    strictPort?: boolean;

    // build - https://github.com/vitejs/vite/blob/v4.0.4/packages/vite/src/node/cli.ts#L197-L233
    /**
     * transpile target
     * @default 'modules'
     */
    target?: string;
    /**
     * output directory
     * @default 'dist'
     */
    outDir?: string;
    /**
     * directory under outDir to place assets in
     * @default 'assets'
     */
    assetsDir?: string;
    /**
     * static asset base64 inline threshold in bytes
     * @default 4096
     */
    assetsInlineLimit?: number;
    // ssr?: string; - Electron applications should not use `ssr`
    /**
     * output source maps for build
     * @default false
     */
    sourcemap?: boolean;
    /**
     * enable/disable minification, or specify minifier to use
     * @default 'esbuild'
     */
    minify?: boolean | 'terser' | 'esbuild';
    /**
     * emit build manifest json
     */
    manifest?: boolean | string;
    // ssrManifest?: boolean | string; - Electron applications should not use `ssr`
    /**
     * force empty outDir when it's outside of root
     */
    emptyOutDir?: boolean;
    /**
     * rebuilds when modules have changed on disk
     */
    watch?: boolean;
  };
}

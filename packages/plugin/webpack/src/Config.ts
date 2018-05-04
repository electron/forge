import { Configuration as WebpackConfiguration } from 'webpack';

export interface WebpackPluginEntryPoint {
  html: string;
  js: string;
  name: string;
  prefixedEntries?: string[];
  preload?: WebpackPreloadEntryPoint;
}

export interface WebpackPreloadEntryPoint {
  js: string;
  prefixedEntries?: string[];
}

export interface WebpackPluginRendererConfig {
  config: WebpackConfiguration | string;

  entryPoints: WebpackPluginEntryPoint[];
}

export interface WebpackPluginConfig {
  mainConfig: WebpackConfiguration | string;
  renderer: WebpackPluginRendererConfig;
}

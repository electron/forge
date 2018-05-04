import { Configuration as WebpackConfiguration } from 'webpack';

export interface WebpackPluginEntryPoint {
  html: string;
  js: string;
  name: string;
}

export interface WebpackPluginRendererConfig {
  config: WebpackConfiguration | string;

  prefixedEntries?: string[];

  entryPoints: WebpackPluginEntryPoint[];
}

export interface WebpackPluginConfig {
  mainConfig: WebpackConfiguration | string;
  renderer: WebpackPluginRendererConfig;
}

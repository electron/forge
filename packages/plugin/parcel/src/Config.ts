export interface ParcelRendererEntries {
  name: string;
  html: string;
  hasNode?: boolean;
  preload?: string;
}

export interface ParcelRendererConfig {
  entries: ParcelRendererEntries[];
}

export interface ParcelPluginConfig {
  main: string;
  renderer: ParcelRendererConfig;
}

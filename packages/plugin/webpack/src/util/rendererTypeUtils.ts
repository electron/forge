import { WebpackPluginEntryPoint, WebpackPluginEntryPointLocalWindow, WebpackPluginEntryPointNoWindow, WebpackPluginEntryPointPreloadOnly } from '../Config';

/**
 * Reusable type predicate functions to narrow down the type of the WebpackPluginEntryPoint
 */

export const isLocalWindow = (entry: WebpackPluginEntryPoint): entry is WebpackPluginEntryPointLocalWindow => {
  return entry.type === 'local-window' || (entry.type === undefined && !!(entry as any).html);
};

export const isPreloadOnly = (entry: WebpackPluginEntryPoint): entry is WebpackPluginEntryPointPreloadOnly => {
  return entry.type === 'preload-only';
};

export const isNoWindow = (entry: WebpackPluginEntryPoint): entry is WebpackPluginEntryPointNoWindow => {
  return entry.type === 'no-window' || (entry.type === undefined && !(entry as any).html && !!(entry as any).js);
};

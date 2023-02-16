import { WebpackPluginEntryPoint, WebpackPluginEntryPointLocalWindow, WebpackPluginEntryPointNoWindow, WebpackPluginEntryPointPreloadOnly } from '../Config';

/**
 * Reusable type predicate functions to narrow down the type of the WebpackPluginEntryPoint
 */

export const isLocalWindow = (entry: WebpackPluginEntryPoint): entry is WebpackPluginEntryPointLocalWindow => {
  return !!(entry as any).html;
};

export const isPreloadOnly = (entry: WebpackPluginEntryPoint): entry is WebpackPluginEntryPointPreloadOnly => {
  return !(entry as any).html && !(entry as any).js && !!(entry as any).preload;
};

export const isNoWindow = (entry: WebpackPluginEntryPoint): entry is WebpackPluginEntryPointNoWindow => {
  return !(entry as any).html && !!(entry as any).js;
};

export const hasPreloadScript = (entry: WebpackPluginEntryPoint): entry is WebpackPluginEntryPointPreloadOnly => {
  return 'preload' in entry;
};

export const isLocalOrNoWindowEntries = (
  entries: WebpackPluginEntryPoint[]
): entries is (WebpackPluginEntryPointLocalWindow | WebpackPluginEntryPointNoWindow)[] => {
  for (const entry of entries) {
    if (!isLocalWindow(entry) && !isNoWindow(entry)) {
      return false;
    }
  }
  return true;
};

export const isPreloadOnlyEntries = (entries: WebpackPluginEntryPoint[]): entries is WebpackPluginEntryPointPreloadOnly[] => {
  for (const entry of entries) {
    if (!hasPreloadScript(entry)) {
      return false;
    }
  }
  return true;
};

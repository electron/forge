import { RspackPluginEntryPoint, RspackPluginEntryPointLocalWindow, RspackPluginEntryPointNoWindow, RspackPluginEntryPointPreloadOnly } from '../Config';

export const isLocalWindow = (entry: RspackPluginEntryPoint): entry is RspackPluginEntryPointLocalWindow => {
  return !!(entry as any).html;
};

export const isNoWindow = (entry: RspackPluginEntryPoint): entry is RspackPluginEntryPointNoWindow => {
  return !(entry as any).html && !!(entry as any).js;
};

export const isLocalOrNoWindowEntries = (
  entries: RspackPluginEntryPoint[]
): entries is (RspackPluginEntryPointLocalWindow | RspackPluginEntryPointNoWindow)[] => {
  for (const entry of entries) {
    if (!isLocalWindow(entry) && !isNoWindow(entry)) {
      return false;
    }
  }
  return true;
};

export const isPreloadOnly = (entry: RspackPluginEntryPoint): entry is RspackPluginEntryPointPreloadOnly => {
  return !(entry as any).html && !(entry as any).js && !!(entry as any).preload;
};

export const hasPreloadScript = (entry: RspackPluginEntryPoint): entry is RspackPluginEntryPointPreloadOnly => {
  return 'preload' in entry;
};

export const isPreloadOnlyEntries = (entries: RspackPluginEntryPoint[]): entries is RspackPluginEntryPointPreloadOnly[] => {
  for (const entry of entries) {
    if (!hasPreloadScript(entry)) {
      return false;
    }
  }
  return true;
};

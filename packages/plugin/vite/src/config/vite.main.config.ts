import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import { getAppProtocolBanner } from '@electron-forge/core-utils';
import {
  external,
  getBuildConfig,
  getBuildDefine,
  pluginAppProtocolRuntime,
  pluginHotRestart,
  pluginViteEntryFallback,
} from './vite.base.config.js';

export function getConfig(
  forgeEnv: ConfigEnv<'build'>,
  userConfig: UserConfig = {},
): UserConfig {
  const { command, forgeConfig, forgeConfigSelf } = forgeEnv;
  const define = getBuildDefine(forgeEnv);
  const rendererNames = forgeConfig.renderer
    .map(({ name }) => name)
    .filter((name) => name != null);
  // Prepend the appProtocol runtime so it runs before any user code — see
  // app-protocol.ts for the ordering constraints. In development the runtime
  // only registers the privileged schemes (so they carry the same privileges
  // as in the packaged app); serving over the scheme is production-only, the
  // dev server serves renderers over HTTP.
  const appProtocolBanner = forgeConfig.appProtocol
    ? getAppProtocolBanner(rendererNames, forgeConfig.appProtocol, {
        serveRenderers: command === 'build',
      })
    : undefined;
  const config: UserConfig = {
    build: {
      copyPublicDir: false,
      rollupOptions: {
        external: [...external, 'electron/main'],
      },
    },
    plugins: [
      ...(appProtocolBanner
        ? [pluginAppProtocolRuntime(appProtocolBanner)]
        : []),
      // Without appProtocol the *_VITE_ENTRY defines point at globals that
      // this plugin's banner assigns packaged file:// URLs (in dev they are
      // dev-server URL strings, so no banner is needed).
      ...(command === 'build' &&
      !forgeConfig.appProtocol &&
      rendererNames.length > 0
        ? [pluginViteEntryFallback(rendererNames)]
        : []),
      ...(forgeEnv.forgeConfig.hotRestart ? [pluginHotRestart('restart')] : []),
    ],
    define,
    resolve: {
      // Load the Node.js entry.
      conditions: ['node'],
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
  };
  const buildConfig = getBuildConfig(forgeEnv);

  if (userConfig.build?.lib == null) {
    config.build!.lib = {
      entry: forgeConfigSelf.entry,
      fileName: () => '[name].js',
      formats: ['cjs'],
    };
  }

  return mergeConfig(mergeConfig(buildConfig, config), userConfig);
}

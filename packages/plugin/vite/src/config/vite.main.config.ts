import { type ConfigEnv, mergeConfig, type UserConfig } from 'vite';

import { getAppProtocolBanner } from '@electron-forge/core-utils';
import {
  external,
  getBuildConfig,
  getBuildDefine,
  pluginHotRestart,
} from './vite.base.config.js';

export function getConfig(
  forgeEnv: ConfigEnv<'build'>,
  userConfig: UserConfig = {},
): UserConfig {
  const { command, forgeConfig, forgeConfigSelf } = forgeEnv;
  const define = getBuildDefine(forgeEnv);
  // In production builds (not the dev server, where renderers are served over
  // HTTP), prepend the runtime that registers the `app://` scheme and serves
  // the built renderer files over it. It must be a banner so it runs before
  // any user code — see app-protocol.ts for the ordering constraints.
  const appProtocolBanner =
    forgeConfig.appProtocol && command === 'build'
      ? getAppProtocolBanner(
          forgeConfig.renderer
            .map(({ name }) => name)
            .filter((name) => name != null),
          forgeConfig.appProtocol,
        )
      : undefined;
  const config: UserConfig = {
    build: {
      copyPublicDir: false,
      rollupOptions: {
        external: [...external, 'electron/main'],
        output: appProtocolBanner ? { banner: appProtocolBanner } : undefined,
      },
    },
    plugins: [
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

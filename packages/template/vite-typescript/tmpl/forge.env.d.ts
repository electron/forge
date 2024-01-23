declare namespace NodeJS {
  interface Process {
    // Used for hot reload after preload scripts.
    viteDevServers: Record<string, import('vite').ViteDevServer>;
  }
}

type VitePluginConfig = ConstructorParameters<typeof import('@electron-forge/plugin-vite').VitePlugin>[0];
type ForgeConfigEnv<K extends keyof VitePluginConfig = keyof VitePluginConfig> = import('vite').ConfigEnv & {
  root: string;
  forgeConfig: VitePluginConfig;
  forgeConfigSelf: VitePluginConfig[K][number];
};

interface VitePluginRuntimeKeys {
  VITE_DEV_SERVER_URL: `${string}_VITE_DEV_SERVER_URL`;
  VITE_NAME: `${string}_VITE_NAME`;
}

import { build } from 'vite';

import ViteConfigGenerator from './ViteConfig.js';

import type {
  VitePluginBuildConfig,
  VitePluginConfig,
  VitePluginRendererConfig,
} from './Config.js';

const projectDir = process.env.FORGE_VITE_PROJECT_DIR;
const kind = process.env.FORGE_VITE_KIND as 'build' | 'renderer';
const index = Number(process.env.FORGE_VITE_INDEX);
const rawConfig = process.env.FORGE_VITE_CONFIG;

if (!projectDir || !kind || !rawConfig || !Number.isInteger(index)) {
  console.error(
    'subprocess-worker: missing one of FORGE_VITE_PROJECT_DIR, FORGE_VITE_KIND, FORGE_VITE_INDEX, FORGE_VITE_CONFIG',
  );
  process.exit(1);
}

// The full plugin config (both build[] and renderer[]) is needed because
// getBuildDefine() reads forgeConfig.renderer to generate ${NAME}_VITE_NAME
// defines when building main targets.
const pluginConfig = JSON.parse(rawConfig) as VitePluginConfig;

const generator = new ViteConfigGenerator(pluginConfig, projectDir, true);

let spec: VitePluginBuildConfig | VitePluginRendererConfig;
let target: 'main' | 'preload' | 'renderer';
if (kind === 'build') {
  spec = pluginConfig.build[index];
  target = (spec as VitePluginBuildConfig).target ?? 'main';
} else {
  spec = pluginConfig.renderer[index];
  target = 'renderer';
}

const resolved = await generator.resolveConfig(spec, target);

await build({
  configFile: false,
  logLevel: 'error',
  ...resolved,
  clearScreen: false,
});

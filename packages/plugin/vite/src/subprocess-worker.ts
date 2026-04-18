import chalk from 'chalk';
import { build } from 'vite';

import { viteDevServerUrls } from './config/vite.base.config.js';
import ViteConfigGenerator from './ViteConfig.js';

import type {
  VitePluginBuildConfig,
  VitePluginConfig,
  VitePluginRendererConfig,
} from './Config.js';
import type { Rollup } from 'vite';

const projectDir = process.env.FORGE_VITE_PROJECT_DIR;
const kind = process.env.FORGE_VITE_KIND as 'build' | 'renderer';
const index = Number(process.env.FORGE_VITE_INDEX);
const rawConfig = process.env.FORGE_VITE_CONFIG;
const watch = process.env.FORGE_VITE_WATCH === '1';
const rawDevServerUrls = process.env.FORGE_VITE_DEV_SERVER_URLS;

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

const generator = new ViteConfigGenerator(pluginConfig, projectDir, !watch);

let spec: VitePluginBuildConfig | VitePluginRendererConfig;
let target: 'main' | 'preload' | 'renderer';
if (kind === 'build') {
  spec = pluginConfig.build[index];
  target = (spec as VitePluginBuildConfig).target ?? 'main';
} else {
  spec = pluginConfig.renderer[index];
  target = 'renderer';
}

// Seed the module-level URL map so getBuildDefine() produces the same
// *_VITE_DEV_SERVER_URL defines the in-process path would have.
if (rawDevServerUrls) {
  Object.assign(viteDevServerUrls, JSON.parse(rawDevServerUrls));
}

const resolved = await generator.resolveConfig(spec, target);

if (!watch) {
  await build({
    configFile: false,
    logLevel: 'error',
    ...resolved,
    clearScreen: false,
  });
} else {
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  const input =
    resolved.build?.rollupOptions?.input ??
    (typeof resolved.build?.lib !== 'boolean'
      ? resolved.build?.lib?.entry
      : undefined);
  const targetDisplay = !input
    ? ''
    : typeof input === 'string'
      ? input
      : Array.isArray(input)
        ? input.join(' ')
        : Object.keys(input).join(' ');

  let firstBuildSent = false;
  const sendOnce = (msg: { type: string; message?: string }) => {
    if (firstBuildSent) return;
    firstBuildSent = true;
    process.send?.(msg);
  };

  const result = await build({
    configFile: false,
    logLevel: 'silent',
    ...resolved,
    plugins: [
      {
        name: '@electron-forge/plugin-vite:build-done',
        buildEnd(err) {
          if (err instanceof Error) {
            sendOnce({ type: 'first-build-error', message: err.message });
          }
        },
        closeBundle() {
          sendOnce({ type: 'first-build-done' });
          if (target === 'preload') {
            // pluginHotRestart('reload') is a no-op here because viteDevServers
            // lives in the parent; ask the parent to fan out the ws full-reload.
            process.send?.({ type: 'reload-renderers' });
          }
        },
      },
      ...(resolved.plugins ?? []),
    ],
    clearScreen: false,
  });

  const isRollupWatcher = (x: unknown): x is Rollup.RollupWatcher =>
    !!x &&
    typeof x === 'object' &&
    'on' in x &&
    typeof x.on === 'function' &&
    'close' in x &&
    typeof x.close === 'function';

  if (isRollupWatcher(result)) {
    result.on('event', (event) => {
      if (event.code === 'ERROR' && resolved.logLevel !== 'silent') {
        console.error(
          `\n${chalk.dim(timeFormatter.format(new Date()))} ${event.error.message}`,
        );
      } else if (
        event.code === 'BUNDLE_END' &&
        (!resolved.logLevel || resolved.logLevel === 'info')
      ) {
        console.log(
          `${chalk.dim(timeFormatter.format(new Date()))} ${chalk.cyan.bold('[@electron-forge/plugin-vite]')} ${chalk.green(
            'target built',
          )} ${chalk.dim(targetDisplay)}`,
        );
      }
    });
  }
}

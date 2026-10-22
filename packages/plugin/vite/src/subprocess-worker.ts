import { styleText } from 'node:util';

import { build } from 'vite';

import { viteDevServerUrls } from './config/vite.base.config.js';
import ViteConfigGenerator from './ViteConfig.js';

import type {
  VitePluginBuildConfig,
  VitePluginConfig,
  VitePluginRendererConfig,
} from './Config.js';
import type { WorkerMessage } from './worker-messages.js';
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
  // Matches the format of the default Vite logger
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  // Rollup's `input` can be a string, an array of strings, or an object.
  // https://rollupjs.org/configuration-options/#input
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

  const send = (msg: WorkerMessage) => process.send?.(msg);

  let firstBuildSent = false;
  const sendOnce = (msg: WorkerMessage) => {
    if (firstBuildSent) return;
    firstBuildSent = true;
    send(msg);
  };

  const result = await build({
    // Avoid recursive builds caused by users configuring @electron-forge/plugin-vite in Vite config file.
    configFile: false,
    // We suppress Vite output and instead log lines using RollupWatcher events
    logLevel: 'silent',
    ...resolved,
    plugins: [
      // `buildEnd` and `closeBundle` are Rollup output generation hooks.
      // https://rollupjs.org/plugin-development/#output-generation-hooks
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
            send({ type: 'reload-renderers' });
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
    // The Rollup watcher emits events for subsequent builds. The parent shows
    // them as the target's status; stdout and stderr land in the same tab.
    result.on('event', (event) => {
      if (event.code === 'START') {
        send({ type: 'build-start' });
      } else if (event.code === 'ERROR') {
        send({ type: 'build-error', message: event.error.message });
        if (resolved.logLevel !== 'silent') {
          console.error(
            `\n${styleText('dim', timeFormatter.format(new Date()))} ${event.error.message}`,
          );
        }
      } else if (event.code === 'BUNDLE_END') {
        send({ type: 'build-done', durationMs: event.duration });
        if (!resolved.logLevel || resolved.logLevel === 'info') {
          console.log(
            `${styleText('dim', timeFormatter.format(new Date()))} ${styleText(['cyan', 'bold'], '[@electron-forge/plugin-vite]')} ${styleText(
              'green',
              'target built',
            )} ${styleText('dim', targetDisplay)}`,
          );
        }
      }
    });
  }
}

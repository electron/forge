import fs from 'node:fs';
import path from 'node:path';

import type {
  VitePluginBuildConfig,
  VitePluginRendererConfig,
} from '../Config.js';
import type { ConfigEnv, Plugin, ResolvedConfig } from 'vite';

type ValidateTarget = 'main' | 'preload' | 'renderer';

const PREFIX = '[@electron-forge/plugin-vite]';

/**
 * Rollup's `input` (and `build.lib.entry`) can be a string, an array of
 * strings, or a `{ name: file }` record.
 * @see https://rollupjs.org/configuration-options/#input
 */
function entryList(entry: unknown): string[] {
  if (typeof entry === 'string') return [entry];
  if (Array.isArray(entry)) return entry.filter((e) => typeof e === 'string');
  if (entry && typeof entry === 'object') {
    return Object.values(entry).filter((e) => typeof e === 'string');
  }
  return [];
}

function hasEntry(entry: unknown): boolean {
  return entryList(entry).length > 0;
}

/**
 * Bare module specifiers are valid Rollup inputs but are not files, so only
 * resolve entries that are written as paths.
 */
function looksLikeFilePath(entry: string): boolean {
  return (
    entry.startsWith('.') ||
    path.isAbsolute(entry) ||
    /\.[cm]?[jt]sx?$/.test(entry)
  );
}

function normalizeOutputs(output: unknown): { format?: string }[] {
  if (!output) return [];
  return (Array.isArray(output) ? output : [output]) as { format?: string }[];
}

/**
 * Vite always resolves `build.target`: when nothing sets it, it becomes Vite's
 * own browser baseline list. `configResolved` therefore cannot tell whether a
 * target was actually chosen. Forge always builds with `configFile: false` and
 * hands Vite the merged Forge + user config inline, so `inlineConfig` is the
 * record of what was asked for.
 */
function configuredTarget(config: ResolvedConfig): string[] | undefined {
  const target = config.inlineConfig?.build?.target;
  if (!target) return undefined;
  const targets = (Array.isArray(target) ? target : [target]).filter(
    (t) => typeof t === 'string',
  );
  return targets.length > 0 ? targets : undefined;
}

export function pluginValidateConfig(
  target: ValidateTarget,
  forgeEnv: ConfigEnv<'build'> | ConfigEnv<'renderer'>,
): Plugin {
  const self = forgeEnv.forgeConfigSelf as Partial<
    VitePluginBuildConfig & VitePluginRendererConfig
  >;
  const entryDisplay =
    target === 'renderer'
      ? (self.name ?? '')
      : entryList(self.entry).join(', ');
  // Every message starts with the Forge target and the Vite config file that
  // configures it, since a project usually has several of both.
  const where = `The ${target} target${entryDisplay ? ` ${JSON.stringify(entryDisplay)}` : ''}${
    self.config ? ` (${self.config})` : ''
  }`;

  const validateBuild = (config: ResolvedConfig) => {
    const { build } = config;
    const lib = typeof build.lib === 'object' ? build.lib : undefined;
    const input =
      build.rollupOptions?.input ?? build.rolldownOptions?.input ?? undefined;
    const entry = lib?.entry ?? input;

    if (!hasEntry(entry)) {
      throw new Error(
        `${PREFIX} ${where} has nothing to build. Set "entry" for the target in your Forge config, or "build.lib.entry" / "build.rollupOptions.input" in the Vite config.`,
      );
    }

    const missing = entryList(entry).filter(
      (file) =>
        looksLikeFilePath(file) &&
        !fs.existsSync(path.resolve(config.root, file)),
    );
    if (missing.length > 0) {
      throw new Error(
        `${PREFIX} ${where} has ${missing.length > 1 ? 'entries' : 'an entry'} that ${
          missing.length > 1 ? 'do' : 'does'
        } not exist: ${missing.map((file) => JSON.stringify(file)).join(', ')}. Entries are resolved relative to ${JSON.stringify(
          config.root,
        )} — point them at files that exist.`,
      );
    }

    const targets = configuredTarget(config);
    const nonNode = targets?.filter((t) => !t.startsWith('node'));
    if (nonNode && nonNode.length > 0) {
      throw new Error(
        `${PREFIX} ${where} sets "build.target" to ${nonNode.map((t) => JSON.stringify(t)).join(', ')}, but ${target} code runs in Electron's Node.js runtime. Use a "node*" target (for example "node22"), or leave "build.target" unset.`,
      );
    }

    const outputs = normalizeOutputs(
      build.rollupOptions?.output ?? build.rolldownOptions?.output,
    );
    // An output may customize file names only and leave the format to
    // `build.lib.formats`, so fall back to it rather than reporting a missing
    // format.
    const libFormats = lib?.formats ?? [];
    const formats =
      outputs.length > 0
        ? outputs.map((output, index) => output?.format ?? libFormats[index])
        : libFormats;

    if (formats.length > 1) {
      throw new Error(
        `${PREFIX} ${where} is configured to emit ${formats.length} outputs (${formats
          .map((format) => JSON.stringify(format ?? null))
          .join(
            ', ',
          )}), but Electron loads a single ${target} bundle. Configure exactly one output.`,
      );
    }

    const format = formats[0];
    if (format === 'cjs') return;

    const fix = lib
      ? 'Set "build.lib.formats" to ["cjs"].'
      : 'Set "build.rollupOptions.output.format" to "cjs".';
    if (format === 'es') {
      throw new Error(
        `${PREFIX} ${where} emits the "es" output format. ESM ${target} bundles are not supported yet: Forge writes them with a ".cjs" extension, so Electron would parse the output as CommonJS and fail. ${fix}`,
      );
    }
    throw new Error(
      `${PREFIX} ${where} ${
        format === undefined
          ? 'does not set an output format'
          : `emits the ${JSON.stringify(format)} output format`
      }, but ${target} bundles must be CommonJS. ${fix}`,
    );
  };

  const validateRenderer = (config: ResolvedConfig) => {
    if (config.base !== './' && config.base !== '/') {
      config.logger.warn(
        `${PREFIX} ${where} sets "base" to ${JSON.stringify(config.base)}. Packaged renderers are loaded from the file system, where only "./" resolves assets correctly ("/" works when you serve the renderer over HTTP).`,
      );
    }

    const targets = configuredTarget(config);
    const unsupported = targets?.filter(
      (t) => !t.startsWith('chrome') && !/^es(20\d\d|next)$/.test(t),
    );
    if (unsupported && unsupported.length > 0) {
      config.logger.warn(
        `${PREFIX} ${where} sets "build.target" to ${unsupported
          .map((t) => JSON.stringify(t))
          .join(
            ', ',
          )}. Renderer code runs in Electron's Chromium, so a "chrome*" or "es20xx"/"esnext" target describes it best.`,
      );
    }

    const input =
      config.build.rollupOptions?.input ??
      config.build.rolldownOptions?.input ??
      undefined;
    if (
      !hasEntry(input) &&
      !fs.existsSync(path.resolve(config.root, 'index.html'))
    ) {
      throw new Error(
        `${PREFIX} ${where} has nothing to build: there is no "index.html" in ${JSON.stringify(
          config.root,
        )} and no "build.rollupOptions.input". Add an "index.html" to the renderer root, or set "build.rollupOptions.input".`,
      );
    }
  };

  return {
    name: `@electron-forge/plugin-vite:validate-${target}`,
    // Run after every user plugin's `config` hook so that what is validated is
    // what will actually be built.
    enforce: 'post',
    configResolved(config) {
      if (target === 'renderer') {
        validateRenderer(config);
      } else {
        validateBuild(config);
      }
    },
  };
}

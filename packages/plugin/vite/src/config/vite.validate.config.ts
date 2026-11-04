import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';

import type {
  VitePluginBuildConfig,
  VitePluginRendererConfig,
} from '../Config.js';
import type { ConfigEnv, Plugin, ResolvedConfig, UserConfig } from 'vite';

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

// Vite's own default target, a browser list that includes current Chromium.
const VITE_DEFAULT_TARGET = 'baseline-widely-available';

type OutputOptions = { format?: string; entryFileNames?: unknown };

function normalizeOutputs(output: unknown): OutputOptions[] {
  if (!output) return [];
  return (Array.isArray(output) ? output : [output]) as OutputOptions[];
}

// Rollup and Rolldown accept these aliases for the two formats Forge cares about.
function normalizeFormat(format: string): string {
  if (format === 'commonjs') return 'cjs';
  if (format === 'esm' || format === 'module') return 'es';
  return format;
}

function targetList(target: unknown): string[] | undefined {
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

  // Vite always resolves `build.target`: when nothing sets it, it becomes
  // Vite's own browser baseline list, so `configResolved` cannot tell whether a
  // target was actually chosen. The `config` hook below records the target
  // that the inline config and every earlier plugin's `config` hook asked for.
  let configuredTargets: string[] | undefined;

  let resolvedRoot = '';

  const validateBuild = (config: ResolvedConfig) => {
    const { build } = config;
    const lib = typeof build.lib === 'object' ? build.lib : undefined;
    const input =
      build.rollupOptions?.input ?? build.rolldownOptions?.input ?? undefined;
    // Vite builds `input` when both are set.
    const entry = input || lib?.entry;

    if (!hasEntry(entry)) {
      throw new Error(
        `${PREFIX} ${where} has nothing to build. Set "entry" for the target in your Forge config, or "build.lib.entry" / "build.rollupOptions.input" in the Vite config.`,
      );
    }

    // ES versions are runtime-agnostic, and sandboxed preload scripts (the
    // default) run in Chromium.
    const unsupported = configuredTargets?.filter(
      (t) =>
        !t.startsWith('node') &&
        !/^es(20\d\d|next)$/.test(t) &&
        !(
          target === 'preload' &&
          (t.startsWith('chrome') || t === VITE_DEFAULT_TARGET)
        ),
    );
    if (unsupported && unsupported.length > 0) {
      const allowed =
        target === 'preload'
          ? 'a "node*", "chrome*" or "es20xx"/"esnext" target (for example "node22" or "chrome120" for a sandboxed preload)'
          : 'a "node*" or "es20xx"/"esnext" target (for example "node22")';
      throw new Error(
        `${PREFIX} ${where} sets "build.target" to ${unsupported.map((t) => JSON.stringify(t)).join(', ')}, which does not describe Electron's ${target} process. Use ${allowed}, or leave "build.target" unset.`,
      );
    }

    const rawOutput =
      build.rollupOptions?.output ?? build.rolldownOptions?.output;
    const outputs = normalizeOutputs(rawOutput);
    // Mirrors Vite's `resolveBuildOutputs`: in lib mode an object output is
    // emitted once per `build.lib.formats` (which overrides its `format`), and
    // an array output ignores `build.lib.formats`. A missing format means "es".
    const libFormats =
      lib?.formats ??
      (entryList(lib?.entry).length > 1 ? ['es', 'cjs'] : ['es', 'umd']);
    const formats = (
      Array.isArray(rawOutput)
        ? outputs.map((output) => output?.format ?? 'es')
        : lib
          ? libFormats
          : [outputs[0]?.format ?? 'es']
    ).map(normalizeFormat);

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
      // ESM is only a problem when the file is still named `.cjs` (as Forge's
      // defaults name it), because Electron would then parse it as CommonJS.
      // Vite gives ESM lib output a `.mjs` or `.js` name of its own, and a
      // file-name function we cannot evaluate is given the benefit of the doubt.
      const entryFileNames = outputs[0]?.entryFileNames;
      const fileName =
        typeof entryFileNames === 'string'
          ? entryFileNames
          : entryFileNames === undefined && typeof lib?.fileName === 'function'
            ? lib.fileName('es', 'index')
            : undefined;
      if (!fileName?.endsWith('.cjs')) return;
      throw new Error(
        `${PREFIX} ${where} emits the "es" output format into ${JSON.stringify(fileName)}. Electron parses ".cjs" files as CommonJS, so the bundle would fail to load. ${fix}`,
      );
    }
    throw new Error(
      `${PREFIX} ${where} emits the ${JSON.stringify(format)} output format, but ${target} bundles must be CommonJS. ${fix}`,
    );
  };

  // `package` and `make` run Vite with `logLevel: 'error'`, which would hide
  // `config.logger.warn`, so warnings go straight to the console (the build
  // subprocess's stderr, which `spawnViteBuild` passes on).
  const warn = (message: string) =>
    console.warn(styleText('yellow', `${PREFIX} ${message}`));

  const validateRenderer = (config: ResolvedConfig) => {
    if (config.base !== './' && config.base !== '/') {
      warn(
        `${where} sets "base" to ${JSON.stringify(config.base)}. Packaged renderers are loaded from the file system, where only "./" resolves assets correctly ("/" works when you serve the renderer over HTTP).`,
      );
    }

    const unsupported = configuredTargets?.filter(
      (t) =>
        !t.startsWith('chrome') &&
        t !== VITE_DEFAULT_TARGET &&
        !/^es(20\d\d|next)$/.test(t),
    );
    if (unsupported && unsupported.length > 0) {
      warn(
        `${where} sets "build.target" to ${unsupported
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
    // Run the `config` hook after the other plugins' so it sees the targets
    // they set. `configResolved` runs after every `config` hook regardless.
    enforce: 'post',
    config(config: UserConfig) {
      configuredTargets = targetList(config.build?.target);
    },
    configResolved(config) {
      resolvedRoot = config.root;
      if (target === 'renderer') {
        validateRenderer(config);
      } else {
        validateBuild(config);
      }
    },
    // Entries are checked once the build starts, through the build's own
    // plugin pipeline, so anything a plugin can resolve (aliases, tsconfig
    // paths, virtual modules) counts as existing.
    async buildStart(options) {
      if (target === 'renderer') return;
      const missing: string[] = [];
      for (const file of entryList(options.input).filter(looksLikeFilePath)) {
        if (!(await this.resolve(file, undefined, { isEntry: true }))) {
          // Vite has already resolved `build.lib.entry` against the root, so
          // show it the way it was written.
          const relative = path.relative(resolvedRoot, file);
          missing.push(
            path.isAbsolute(file) &&
              !relative.startsWith('..') &&
              !path.isAbsolute(relative)
              ? relative.split(path.sep).join('/')
              : file,
          );
        }
      }
      if (missing.length > 0) {
        throw new Error(
          `${PREFIX} ${where} has ${missing.length > 1 ? 'entries' : 'an entry'} that ${
            missing.length > 1 ? 'do' : 'does'
          } not exist: ${missing.map((file) => JSON.stringify(file)).join(', ')}. Entries are resolved relative to ${JSON.stringify(
            resolvedRoot,
          )}: point them at files that exist.`,
        );
      }
    },
  };
}

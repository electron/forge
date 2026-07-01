import Module from 'node:module';
import path from 'node:path';

import { ForgeConfig, ResolvedForgeConfig } from '@electron-forge/shared-types';
import { Eta } from 'eta';
import fs from 'fs-extra';
import * as interpret from 'interpret';
import * as rechoir from 'rechoir';

// eslint-disable-next-line n/no-missing-import
import { dynamicImportMaybe } from '../../helper/dynamic-import.js';

import { runMutatingHook } from './hook';
import PluginInterface from './plugin-interface';
import { readRawPackageJson } from './read-package-json';

import type { createJiti } from 'jiti';

// Node's require.cache is keyed by realpath'd, case-preserving filenames. On
// Windows (a case-insensitive filesystem) jiti's internally-resolved module
// filenames are not case-canonicalized against those keys, so jiti's dedup
// (a lookup into its require's `.cache`) misses a module Node has already
// loaded and jiti evaluates a *second* copy of it. When that module is webpack,
// the duplicate copy's `Compilation.PROCESS_ASSETS_STAGE_*` constants come back
// undefined and plugins tap `processAssets` at the wrong stage, silently
// dropping assets like index.html from the packaged app. See electron/forge#3949.
//
// This wraps the raw require.cache in a Proxy that also resolves lookups by a
// case-insensitive fallback, so jiti's dedup finds the already-loaded copy.
type ModuleCache = Record<string, NodeModule | undefined>;

export function createCaseInsensitiveModuleCache(
  realCache: ModuleCache,
): ModuleCache {
  // Lazily-built lower-cased-key -> real-key index, invalidated on mutation.
  let lowerIndex: Map<string, string> | null = null;
  const buildIndex = () => {
    lowerIndex = new Map();
    for (const key of Object.keys(realCache)) {
      lowerIndex.set(key.toLowerCase(), key);
    }
  };
  // Returns the real (case-preserving) cache key for a requested key when it
  // only differs by case, or undefined when the exact key already exists or no
  // case-insensitive match is found.
  const canonicalKey = (prop: string | symbol): string | undefined => {
    if (typeof prop !== 'string' || prop in realCache) return undefined;
    if (lowerIndex === null) buildIndex();
    return lowerIndex!.get(prop.toLowerCase());
  };
  return new Proxy(realCache, {
    get(target, prop, receiver) {
      const key = canonicalKey(prop);
      if (key !== undefined && key in target) return target[key];
      return Reflect.get(target, prop, receiver);
    },
    has(target, prop) {
      if (canonicalKey(prop) !== undefined) return true;
      return Reflect.has(target, prop);
    },
    set(target, prop, value, receiver) {
      lowerIndex = null;
      return Reflect.set(target, prop, value, receiver);
    },
    deleteProperty(target, prop) {
      lowerIndex = null;
      return Reflect.deleteProperty(target, prop);
    },
  });
}

// jiti destructures `createRequire` from `node:module` at its own load time and
// forge-config.ts is jiti's sole importer, so we can scope the fix to exactly
// the moment jiti is loaded: temporarily wrap `Module.createRequire` so the
// require jiti builds for itself gets a case-insensitive view over the same
// module cache, then restore it in a `finally`. Only jiti's own require view is
// affected; the global require.cache is never written or replaced. Off-win32,
// jiti is loaded untouched. Must use CJS `require('jiti')` (not dynamic import)
// so the wrapped `createRequire` is the one jiti captures.
let cachedCreateJiti: typeof createJiti | undefined;
function loadCreateJiti(): typeof createJiti {
  if (cachedCreateJiti) return cachedCreateJiti;
  if (process.platform !== 'win32') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedCreateJiti = require('jiti').createJiti;
    return cachedCreateJiti!;
  }
  const original = Module.createRequire;
  Module.createRequire = function patchedCreateRequire(filename) {
    const req = original.call(this, filename);
    try {
      req.cache = createCaseInsensitiveModuleCache(req.cache);
    } catch {
      // req.cache non-writable in some runtime: fall back to the untouched cache
    }
    return req;
  };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedCreateJiti = require('jiti').createJiti;
  } finally {
    Module.createRequire = original;
  }
  return cachedCreateJiti!;
}

const underscoreCase = (str: string) =>
  str
    .replace(/(.)([A-Z][a-z]+)/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();

// Why: needs access to Object methods and also needs to be able to match any interface.
type ProxiedObject = object;

/* eslint-disable @typescript-eslint/no-explicit-any */
function isBuildIdentifierConfig(
  value: any,
): value is BuildIdentifierConfig<any> {
  return (
    value && typeof value === 'object' && value.__isMagicBuildIdentifierMap
  );
}

const proxify = <T extends ProxiedObject>(
  buildIdentifier: string | (() => string),
  proxifiedObject: T,
  envPrefix: string,
): T => {
  let newObject: T = {} as any;
  if (Array.isArray(proxifiedObject)) {
    newObject = [] as any;
  }

  for (const [key, val] of Object.entries(proxifiedObject)) {
    if (
      typeof val === 'object' &&
      (val.constructor === Object || val.constructor === Array) &&
      key !== 'pluginInterface' &&
      !(val instanceof RegExp)
    ) {
      (newObject as any)[key] = proxify(
        buildIdentifier,
        (proxifiedObject as any)[key],
        `${envPrefix}_${underscoreCase(key)}`,
      );
    } else {
      (newObject as any)[key] = (proxifiedObject as any)[key];
    }
  }

  return new Proxy<T>(newObject, {
    get(target, name, receiver) {
      // eslint-disable-next-line no-prototype-builtins
      if (!target.hasOwnProperty(name) && typeof name === 'string') {
        const envValue = process.env[`${envPrefix}_${underscoreCase(name)}`];
        if (envValue) return envValue;
      }
      const value = Reflect.get(target, name, receiver);

      if (isBuildIdentifierConfig(value)) {
        const identifier =
          typeof buildIdentifier === 'function'
            ? buildIdentifier()
            : buildIdentifier;
        return value.map[identifier];
      }
      return value;
    },
    getOwnPropertyDescriptor(target, name) {
      const envValue =
        process.env[`${envPrefix}_${underscoreCase(name as string)}`];
      // eslint-disable-next-line no-prototype-builtins
      if (target.hasOwnProperty(name)) {
        return Reflect.getOwnPropertyDescriptor(target, name);
      }

      if (envValue) {
        return {
          writable: true,
          enumerable: true,
          configurable: true,
          value: envValue,
        };
      }

      return undefined;
    },
  });
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export const registeredForgeConfigs: Map<string, ForgeConfig> = new Map();
export function registerForgeConfigForDirectory(
  dir: string,
  config: ForgeConfig,
): void {
  registeredForgeConfigs.set(path.resolve(dir), config);
}
export function unregisterForgeConfigForDirectory(dir: string): void {
  registeredForgeConfigs.delete(path.resolve(dir));
}

export type BuildIdentifierMap<T> = Record<string, T | undefined>;
export type BuildIdentifierConfig<T> = {
  map: BuildIdentifierMap<T>;
  __isMagicBuildIdentifierMap: true;
};

export function fromBuildIdentifier<T>(
  map: BuildIdentifierMap<T>,
): BuildIdentifierConfig<T> {
  return {
    map,
    __isMagicBuildIdentifierMap: true,
  };
}

export async function forgeConfigIsValidFilePath(
  dir: string,
  forgeConfig: string | ForgeConfig,
): Promise<boolean> {
  return (
    typeof forgeConfig === 'string' &&
    ((await fs.pathExists(path.resolve(dir, forgeConfig))) ||
      fs.pathExists(path.resolve(dir, `${forgeConfig}.js`)))
  );
}

const eta = new Eta({ useWith: true, autoEscape: false, autoTrim: false });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderConfigTemplate(
  dir: string,
  templateObj: any,
  obj: any,
): void {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      renderConfigTemplate(dir, templateObj, value);
    } else if (typeof value === 'string') {
      obj[key] = eta.renderString(value, templateObj);
      if (obj[key].startsWith('require:')) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        obj[key] = require(path.resolve(dir, obj[key].substr(8)));
      }
    }
  }
}

type MaybeESM<T> = T | { default: T };
type AsyncForgeConfigGenerator = () => Promise<ForgeConfig>;

export default async (dir: string): Promise<ResolvedForgeConfig> => {
  let forgeConfig: ForgeConfig | string | null | undefined =
    registeredForgeConfigs.get(dir);

  const packageJSON = await readRawPackageJson(dir);
  if (forgeConfig === undefined) {
    forgeConfig =
      packageJSON.config && packageJSON.config.forge
        ? packageJSON.config.forge
        : null;
  }

  if (!forgeConfig || typeof forgeConfig === 'string') {
    // interpret.extensions doesn't support `.mts` files
    for (const extension of [
      '.js',
      '.mts',
      ...Object.keys(interpret.extensions),
    ]) {
      const pathToConfig = path.resolve(dir, `forge.config${extension}`);
      if (await fs.pathExists(pathToConfig)) {
        // Use rechoir to parse alternative syntaxes (except for TypeScript where we use jiti)
        if (!['.cts', '.mts', '.ts'].includes(extension)) {
          rechoir.prepare(interpret.extensions, pathToConfig, dir);
        }
        forgeConfig = `forge.config${extension}`;
        break;
      }
    }
  }
  forgeConfig = forgeConfig || ({} as ForgeConfig);

  if (await forgeConfigIsValidFilePath(dir, forgeConfig)) {
    const forgeConfigPath = path.resolve(dir, forgeConfig as string);
    try {
      let loadFn;
      if (['.cts', '.mts', '.ts'].includes(path.extname(forgeConfigPath))) {
        const jiti = loadCreateJiti()(__filename);
        loadFn = jiti.import;
      } else {
        loadFn = dynamicImportMaybe;
      }
      // The loaded "config" could potentially be a static forge config, ESM module or async function
      const loaded = (await loadFn(forgeConfigPath)) as MaybeESM<
        ForgeConfig | AsyncForgeConfigGenerator
      >;
      const maybeForgeConfig = 'default' in loaded ? loaded.default : loaded;
      forgeConfig =
        typeof maybeForgeConfig === 'function'
          ? await maybeForgeConfig()
          : maybeForgeConfig;
    } catch (err) {
      console.error(`Failed to load: ${forgeConfigPath}`);
      throw err;
    }
  } else if (typeof forgeConfig !== 'object') {
    throw new Error(
      'Expected packageJSON.config.forge to be an object or point to a requirable JS file',
    );
  }
  const defaultForgeConfig = {
    rebuildConfig: {},
    packagerConfig: {},
    makers: [],
    publishers: [],
    plugins: [],
  };
  let resolvedForgeConfig: ResolvedForgeConfig = {
    ...defaultForgeConfig,
    ...forgeConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pluginInterface: null as any,
  };

  const templateObj = { ...packageJSON, year: new Date().getFullYear() };
  renderConfigTemplate(dir, templateObj, resolvedForgeConfig);

  resolvedForgeConfig.pluginInterface = await PluginInterface.create(
    dir,
    resolvedForgeConfig,
  );

  resolvedForgeConfig = await runMutatingHook(
    resolvedForgeConfig,
    'resolveForgeConfig',
    resolvedForgeConfig,
  );

  return proxify<ResolvedForgeConfig>(
    resolvedForgeConfig.buildIdentifier || '',
    resolvedForgeConfig,
    'ELECTRON_FORGE',
  );
};

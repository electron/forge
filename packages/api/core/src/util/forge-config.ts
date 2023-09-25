import path from 'path';

import { ForgeConfig, ResolvedForgeConfig } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import * as interpret from 'interpret';
import { template } from 'lodash';
import * as rechoir from 'rechoir';

import { dynamicImport } from '../../helper/dynamic-import.js';

import { runMutatingHook } from './hook';
import PluginInterface from './plugin-interface';
import { readRawPackageJson } from './read-package-json';

const underscoreCase = (str: string) =>
  str
    .replace(/(.)([A-Z][a-z]+)/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();

// Why: needs access to Object methods and also needs to be able to match any interface.
// eslint-disable-next-line @typescript-eslint/ban-types
type ProxiedObject = object;

/* eslint-disable @typescript-eslint/no-explicit-any */
const proxify = <T extends ProxiedObject>(buildIdentifier: string | (() => string), proxifiedObject: T, envPrefix: string): T => {
  let newObject: T = {} as any;
  if (Array.isArray(proxifiedObject)) {
    newObject = [] as any;
  }

  for (const [key, val] of Object.entries(proxifiedObject)) {
    if (typeof val === 'object' && (val.constructor === Object || val.constructor === Array) && key !== 'pluginInterface' && !(val instanceof RegExp)) {
      (newObject as any)[key] = proxify(buildIdentifier, (proxifiedObject as any)[key], `${envPrefix}_${underscoreCase(key)}`);
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

      if (value && typeof value === 'object' && value.__isMagicBuildIdentifierMap) {
        const identifier = typeof buildIdentifier === 'function' ? buildIdentifier() : buildIdentifier;
        return value.map[identifier];
      }
      return value;
    },
    getOwnPropertyDescriptor(target, name) {
      const envValue = process.env[`${envPrefix}_${underscoreCase(name as string)}`];
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

export type BuildIdentifierMap<T> = Record<string, T | undefined>;
export type BuildIdentifierConfig<T> = {
  map: BuildIdentifierMap<T>;
  __isMagicBuildIdentifierMap: true;
};

export function fromBuildIdentifier<T>(map: BuildIdentifierMap<T>): BuildIdentifierConfig<T> {
  return {
    map,
    __isMagicBuildIdentifierMap: true,
  };
}

export async function forgeConfigIsValidFilePath(dir: string, forgeConfig: string | ForgeConfig): Promise<boolean> {
  return typeof forgeConfig === 'string' && ((await fs.pathExists(path.resolve(dir, forgeConfig))) || fs.pathExists(path.resolve(dir, `${forgeConfig}.js`)));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderConfigTemplate(dir: string, templateObj: any, obj: any): void {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      renderConfigTemplate(dir, templateObj, value);
    } else if (typeof value === 'string') {
      obj[key] = template(value)(templateObj);
      if (obj[key].startsWith('require:')) {
        obj[key] = require(path.resolve(dir, obj[key].substr(8)));
      }
    }
  }
}

type MaybeESM<T> = T | { default: T };
type AsyncForgeConfigGenerator = () => Promise<ForgeConfig>;

export default async (dir: string): Promise<ResolvedForgeConfig> => {
  const packageJSON = await readRawPackageJson(dir);
  let forgeConfig: ForgeConfig | string | null = packageJSON.config && packageJSON.config.forge ? packageJSON.config.forge : null;

  if (!forgeConfig || typeof forgeConfig === 'string') {
    for (const extension of ['.js', ...Object.keys(interpret.extensions)]) {
      const pathToConfig = path.resolve(dir, `forge.config${extension}`);
      if (await fs.pathExists(pathToConfig)) {
        rechoir.prepare(interpret.extensions, pathToConfig, dir);
        forgeConfig = `forge.config${extension}`;
        break;
      }
    }
  }
  forgeConfig = forgeConfig || ({} as ForgeConfig);

  if (await forgeConfigIsValidFilePath(dir, forgeConfig)) {
    const forgeConfigPath = path.resolve(dir, forgeConfig as string);
    try {
      // The loaded "config" could potentially be a static forge config, ESM module or async function
      let loaded;
      try {
        loaded = (await dynamicImport(forgeConfigPath)) as MaybeESM<ForgeConfig | AsyncForgeConfigGenerator>;
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        loaded = require(forgeConfigPath) as MaybeESM<ForgeConfig | AsyncForgeConfigGenerator>;
      }
      const maybeForgeConfig = 'default' in loaded ? loaded.default : loaded;
      forgeConfig = typeof maybeForgeConfig === 'function' ? await maybeForgeConfig() : maybeForgeConfig;
    } catch (err) {
      console.error(`Failed to load: ${forgeConfigPath}`);
      throw err;
    }
  } else if (typeof forgeConfig !== 'object') {
    throw new Error('Expected packageJSON.config.forge to be an object or point to a requirable JS file');
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

  resolvedForgeConfig.pluginInterface = new PluginInterface(dir, resolvedForgeConfig);

  resolvedForgeConfig = await runMutatingHook(resolvedForgeConfig, 'resolveForgeConfig', resolvedForgeConfig);

  return proxify<ResolvedForgeConfig>(resolvedForgeConfig.buildIdentifier || '', resolvedForgeConfig, 'ELECTRON_FORGE');
};

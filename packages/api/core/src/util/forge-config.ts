import { ForgeConfig, IForgeResolvableMaker } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import path from 'path';
import { template } from 'lodash';

import { readRawPackageJson } from './read-package-json';
import PluginInterface from './plugin-interface';
import { runMutatingHook } from './hook';

const underscoreCase = (str: string) =>
  str
    .replace(/(.)([A-Z][a-z]+)/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();

export type PackageJSONForInitialForgeConfig = {
  name?: string;
  config: {
    forge: {
      makers: Pick<IForgeResolvableMaker, 'name' | 'config'>[];
    };
  };
};

// Why: needs access to Object methods and also needs to be able to match any interface.
// eslint-disable-next-line @typescript-eslint/ban-types
type ProxiedObject = object;

/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line arrow-parens
const proxify = <T extends ProxiedObject>(buildIdentifier: string | (() => string), proxifiedObject: T, envPrefix: string): T => {
  let newObject: T = {} as any;
  if (Array.isArray(proxifiedObject)) {
    newObject = [] as any;
  }

  for (const [key, val] of Object.entries(proxifiedObject)) {
    if (typeof val === 'object' && key !== 'pluginInterface' && !(val instanceof RegExp)) {
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

      // eslint-disable-next-line no-underscore-dangle
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

/**
 * Sets sensible defaults for the `config.forge` object.
 */
export function setInitialForgeConfig(packageJSON: PackageJSONForInitialForgeConfig): void {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  const { name = '' } = packageJSON;

  ((packageJSON.config.forge as ForgeConfig).makers as IForgeResolvableMaker[])[0].config.name = name.replace(/-/g, '_');
}

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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function renderConfigTemplate(dir: string, templateObj: any, obj: any): void {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      renderConfigTemplate(dir, templateObj, value);
    } else if (typeof value === 'string') {
      obj[key] = template(value)(templateObj);
      if (obj[key].startsWith('require:')) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        obj[key] = require(path.resolve(dir, obj[key].substr(8)));
      }
    }
  }
}

export default async (dir: string): Promise<ForgeConfig> => {
  const packageJSON = await readRawPackageJson(dir);
  let forgeConfig: ForgeConfig | string | null = packageJSON.config && packageJSON.config.forge ? packageJSON.config.forge : null;

  if (!forgeConfig) {
    if (await fs.pathExists(path.resolve(dir, 'forge.config.js'))) {
      forgeConfig = 'forge.config.js';
    } else {
      forgeConfig = {} as ForgeConfig;
    }
  }

  if (await forgeConfigIsValidFilePath(dir, forgeConfig)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-dynamic-require
      forgeConfig = require(path.resolve(dir, forgeConfig as string)) as ForgeConfig;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load: ${path.resolve(dir, forgeConfig as string)}`);
      throw err;
    }
  } else if (typeof forgeConfig !== 'object') {
    throw new Error('Expected packageJSON.config.forge to be an object or point to a requirable JS file');
  }
  const defaultForgeConfig = {
    electronRebuildConfig: {},
    packagerConfig: {},
    makers: [],
    publishers: [],
    plugins: [],
  };
  forgeConfig = {
    ...defaultForgeConfig,
    ...forgeConfig,
  };

  const templateObj = { ...packageJSON, year: new Date().getFullYear() };
  renderConfigTemplate(dir, templateObj, forgeConfig);

  forgeConfig.pluginInterface = new PluginInterface(dir, forgeConfig);

  forgeConfig = await runMutatingHook(forgeConfig, 'resolveForgeConfig', forgeConfig);

  return proxify<ForgeConfig>(forgeConfig.buildIdentifier || '', forgeConfig, 'ELECTRON_FORGE');
};

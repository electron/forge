import { ForgeConfig } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import path from 'path';
import _template from 'lodash.template';

import { readRawPackageJson } from './read-package-json';
import PluginInterface from './plugin-interface';
import { runMutatingHook } from './hook';

const underscoreCase = (str: string) => str.replace(/(.)([A-Z][a-z]+)/g, '$1_$2').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

// eslint-disable-next-line arrow-parens
const proxify = <T extends object>(
  buildIdentifier: string | (() => string),
  object: T,
  envPrefix: string,
): T => {
  let newObject: T = {} as any;
  if (Array.isArray(object)) {
    newObject = [] as any;
  }

  Object.keys(object).forEach((key) => {
    const val = (object as any)[key];
    if (typeof val === 'object' && key !== 'pluginInterface' && !(val instanceof RegExp)) {
      (newObject as any)[key] = proxify(buildIdentifier, (object as any)[key], `${envPrefix}_${underscoreCase(key)}`);
    } else {
      (newObject as any)[key] = (object as any)[key];
    }
  });

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

      return null;
    },
  });
};

/**
 * Sets sensible defaults for the `config.forge` object.
 */
export function setInitialForgeConfig(packageJSON: any) {
  const { name = '' } = packageJSON;

  /* eslint-disable no-param-reassign */
  packageJSON.config.forge.makers[0].config.name = name.replace(/-/g, '_');
  /* eslint-enable no-param-reassign */
}

export function fromBuildIdentifier<T>(map: { [key: string]: T | undefined }) {
  return {
    map,
    __isMagicBuildIdentifierMap: true,
  };
}

async function forgeConfigIsValidFilePath(dir, forgeConfig) {
  return typeof forgeConfig === 'string'
    && (
      await fs.pathExists(path.resolve(dir, forgeConfig))
      || fs.pathExists(path.resolve(dir, `${forgeConfig}.js`))
    );
}

export default async (dir: string) => {
  const packageJSON = await readRawPackageJson(dir);
  let forgeConfig: ForgeConfig | string | null = (packageJSON.config && packageJSON.config.forge)
    ? packageJSON.config.forge
    : null;

  if (!forgeConfig) {
    if (await fs.pathExists(path.resolve(dir, 'forge.config.js'))) {
      forgeConfig = 'forge.config.js';
    } else {
      forgeConfig = {} as any as ForgeConfig;
    }
  }

  if (forgeConfigIsValidFilePath(dir, forgeConfig)) {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      forgeConfig = require(path.resolve(dir, forgeConfig)) as ForgeConfig;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to load: ${path.resolve(dir, forgeConfig)}`);
      throw err;
    }
  } else if (typeof forgeConfig !== 'object') {
    throw new Error('Expected packageJSON.config.forge to be an object or point to a requirable JS file');
  }
  forgeConfig = Object.assign({
    packagerConfig: {},
    rebuildConfig: {},
    makers: [],
    publishers: [],
    plugins: [],
  }, forgeConfig);

  const templateObj = Object.assign({}, packageJSON, { year: (new Date()).getFullYear() });
  const template = (obj: any) => {
    Object.keys(obj).forEach((objKey) => {
      if (typeof obj[objKey] === 'object' && obj !== null) {
        template(obj[objKey]);
      } else if (typeof obj[objKey] === 'string') {
        obj[objKey] = _template(obj[objKey])(templateObj); // eslint-disable-line
        if (obj[objKey].startsWith('require:')) {
          obj[objKey] = require(path.resolve(dir, obj[objKey].substr(8))); // eslint-disable-line
        }
      }
    });
  };

  template(forgeConfig);

  forgeConfig.pluginInterface = new PluginInterface(dir, forgeConfig);

  forgeConfig = await runMutatingHook(forgeConfig, 'resolveForgeConfig', forgeConfig);

  return proxify<ForgeConfig>(forgeConfig.buildIdentifier || '', forgeConfig, 'ELECTRON_FORGE');
};

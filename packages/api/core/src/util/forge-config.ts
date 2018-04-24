import { ForgeConfig } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import path from 'path';
import _template from 'lodash.template';

import readPackageJSON from './read-package-json';
import PluginInterface from './plugin-interface';

const underscoreCase = (str: string) => str.replace(/(.)([A-Z][a-z]+)/g, '$1_$2').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

const proxify = <T extends object>(object: T, envPrefix: string): T => {
  const newObject: T = {} as any;

  Object.keys(object).forEach((key) => {
    if (typeof (object as any)[key] === 'object' && !Array.isArray((object as any)[key]) && key !== 'pluginInterface') {
      (newObject as any)[key] = proxify((object as any)[key], `${envPrefix}_${underscoreCase(key)}`);
    } else {
      (newObject as any)[key] = (object as any)[key];
    }
  });

  return new Proxy<T>(newObject, {
    get(target, name) {
      // eslint-disable-next-line no-prototype-builtins
      if (!target.hasOwnProperty(name) && typeof name === 'string') {
        const envValue = process.env[`${envPrefix}_${underscoreCase(name)}`];
        if (envValue) return envValue;
      }
      return (target as any)[name];
    },
    getOwnPropertyDescriptor(target, name) {
      const envValue = process.env[`${envPrefix}_${underscoreCase(name as string)}`];
      // eslint-disable-next-line no-prototype-builtins
      if (target.hasOwnProperty(name)) {
        return Object.getOwnPropertyDescriptor(target, name);
      } else if (envValue) {
        return { writable: true, enumerable: true, configurable: true, value: envValue };
      }
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

export default async (dir: string) => {
  const packageJSON = await readPackageJSON(dir);
  let forgeConfig: ForgeConfig | string = packageJSON.config.forge;

  if (typeof forgeConfig === 'string' && (await fs.pathExists(path.resolve(dir, forgeConfig)) || await fs.pathExists(path.resolve(dir, `${forgeConfig}.js`)))) {
    try {
      forgeConfig = require(path.resolve(dir, forgeConfig)) as ForgeConfig;
    } catch (err) {
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

  return proxify<ForgeConfig>(forgeConfig, 'ELECTRON_FORGE');
};

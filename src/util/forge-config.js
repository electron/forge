import fs from 'fs-extra';
import path from 'path';
import _template from 'lodash.template';
import readPackageJSON from './read-package-json';
import yarnOrNpm from './yarn-or-npm';

const underscoreCase = str => str.replace(/(.)([A-Z][a-z]+)/g, '$1_$2').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

const proxify = (object, envPrefix) => {
  const newObject = {};

  Object.keys(object).forEach((key) => {
    if (typeof object[key] === 'object' && !Array.isArray(object[key])) {
      newObject[key] = proxify(object[key], `${envPrefix}_${underscoreCase(key)}`);
    } else {
      newObject[key] = object[key];
    }
  });

  return new Proxy(newObject, {
    get(target, name) {
      // eslint-disable-next-line no-prototype-builtins
      if (!target.hasOwnProperty(name) && typeof name === 'string') {
        const envValue = process.env[`${envPrefix}_${underscoreCase(name)}`];
        if (envValue) return envValue;
      }
      return target[name];
    },
    getOwnPropertyDescriptor(target, name) {
      const envValue = process.env[`${envPrefix}_${underscoreCase(name)}`];
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
export function setInitialForgeConfig(packageJSON) {
  const { name = '', productName = '' } = packageJSON;

  /* eslint-disable no-param-reassign */
  packageJSON.config.forge.electronWinstallerConfig.name = name.replace(/-/g, '_');
  packageJSON.config.forge.windowsStoreConfig.name = productName.replace(/-/g, '');
  packageJSON.config.forge.electronPackagerConfig.packageManager = yarnOrNpm();
  /* eslint-enable no-param-reassign */
}

export default async (dir) => {
  const packageJSON = await readPackageJSON(dir);
  let forgeConfig = packageJSON.config.forge;
  if (typeof forgeConfig === 'string' && (await fs.pathExists(path.resolve(dir, forgeConfig)) || await fs.pathExists(path.resolve(dir, `${forgeConfig}.js`)))) {
    try {
      forgeConfig = require(path.resolve(dir, forgeConfig));
    } catch (err) {
      console.error(`Failed to load: ${path.resolve(dir, forgeConfig)}`);
      throw err;
    }
  } else if (typeof forgeConfig !== 'object') {
    throw new Error('Expected packageJSON.config.forge to be an object or point to a requirable JS file');
  }
  forgeConfig = Object.assign({
    make_targets: {},
    publish_targets: {},
    electronPackagerConfig: {},
    electronWinstallerConfig: {},
    electronInstallerDebian: {},
    electronInstallerDMG: {},
    electronInstallerRedhat: {},
    s3: {},
    github_repository: {},
    electronReleaseServer: {},
  }, forgeConfig);
  forgeConfig.make_targets = Object.assign({
    win32: ['squirrel'],
    darwin: ['zip'],
    mas: ['zip'],
    linux: ['deb', 'rpm'],
  }, forgeConfig.make_targets);
  forgeConfig.publish_targets = Object.assign({
    win32: ['github'],
    darwin: ['github'],
    mas: ['github'],
    linux: ['github'],
  }, forgeConfig.publish_targets);

  const templateObj = Object.assign({}, packageJSON, { year: (new Date()).getFullYear() });
  const template = (obj) => {
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

  return proxify(forgeConfig, 'ELECTRON_FORGE');
};

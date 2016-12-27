import fs from 'fs-promise';
import path from 'path';
import _template from 'lodash.template';
import readPackageJSON from './read-package-json';

export default async (dir) => {
  const packageJSON = await readPackageJSON(dir);
  let forgeConfig = packageJSON.config.forge;
  if (typeof forgeConfig === 'string' && (await fs.exists(path.resolve(dir, forgeConfig)) || await fs.exists(path.resolve(dir, `${forgeConfig}.js`)))) {
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
    electronPackagerConfig: {},
    electronWinstallerConfig: {},
    electronInstallerDebian: {},
    electronInstallerDMG: {},
    electronInstallerRedhat: {},
  }, forgeConfig);
  forgeConfig.make_targets = Object.assign({
    win32: ['squirrel'],
    darwin: ['zip'],
    mas: ['zip'],
    linux: ['deb', 'rpm'],
  }, forgeConfig.make_targets);

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

  return forgeConfig;
};

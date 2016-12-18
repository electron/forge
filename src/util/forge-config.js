import fs from 'fs-promise';
import path from 'path';
import readPackageJSON from './read-package-json';

export default async (dir) => {
  let forgeConfig = (await readPackageJSON(dir)).config.forge;
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
  return forgeConfig;
};

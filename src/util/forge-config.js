import fs from 'fs-promise';
import path from 'path';

export default async (dir) => {
  let forgeConfig = JSON.parse(await fs.readFile(path.resolve(dir, 'package.json'))).config.forge;
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
    linux: ['deb', 'rpm'],
  }, forgeConfig.make_targets);
  return forgeConfig;
};

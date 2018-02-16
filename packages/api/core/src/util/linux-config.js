import merge from 'lodash.merge';
import path from 'path';

import configFn from './config-fn';

export function populateConfig({ forgeConfig, configKey, targetArch }) {
  const config = configFn(forgeConfig[configKey] || {}, targetArch);
  config.options = config.options || {};

  return config;
}

export function linuxConfig({ config, pkgArch, dir, outPath }) {
  return merge({}, config, {
    arch: pkgArch,
    dest: path.dirname(outPath),
    src: dir,
  });
}

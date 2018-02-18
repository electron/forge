import 'colors';

import _import from './import';
import init from './init';
import install from './install';
import lint from './lint';
import make from './make';
import _package from './package';
import publish from './publish';
import start from './start';

import getForgeConfig from '../util/forge-config';
import readPackageJSON from '../util/read-package-json';

module.exports = {
  'import': _import, // eslint-disable-line
  init,
  install,
  lint,
  make,
  'package': _package, // eslint-disable-line
  publish,
  start,
  utils: {
    getForgeConfig,
    readPackageJSON,
  },
};

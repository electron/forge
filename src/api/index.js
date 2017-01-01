import 'colors';

import _import from './import';
import init from './init';
import install from './install';
import lint from './lint';
import make from './make';
import _package from './package';
import publish from './publish';
import start from './start';

module.exports = {
  'import': _import, // eslint-disable-line
  init,
  install,
  lint,
  make,
  'pacakge': _package, // eslint-disable-line
  publish,
  start,
};

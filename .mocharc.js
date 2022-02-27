const path = require('path');

module.exports = {
  extension: ['ts'],
  loader: 'ts-node/esm',
  require: [path.join(__dirname, 'tools', 'test-setup.ts')],
  timeout: 800000,
  recursive: true,
};

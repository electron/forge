const path = require('path');

module.exports = {
  extension: ['ts'],
  require: ['ts-node/register', path.join(__dirname, 'tools', 'test-setup.ts')],
  timeout: 800000,
  recursive: true,
};

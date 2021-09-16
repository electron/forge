const path = require('path');

module.exports = {
  require: ['ts-node/register', '@swc/register', path.join(__dirname, 'tools', 'test-setup.ts')],
  timeout: 800000,
  recursive: true,
};

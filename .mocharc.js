const path = require('path');

const reporterConfig = process.env.CI
  ? {
      reporter: 'mocha-junit-reporter',
      'reporter-option': ['mochaFile=./reports/test_output.xml'],
    }
  : {};

module.exports = {
  extension: ['ts'],
  require: ['ts-node/register', path.join(__dirname, 'tools', 'test-setup.ts')],
  timeout: 800000,
  recursive: true,
  ...reporterConfig,
};

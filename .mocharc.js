const path = require('path');
const minimist = require('minimist');

const {
  _: [_node, _mocha, ...args], // _ contains the node binary, the mocha binary, and any positional args
  ...flags
} = minimist(process.argv);

process.env.LINK_FORGE_DEPENDENCIES_ON_INIT = true;

let testGlob;

/**
 * Determine which sets of tests to run. Priority goes:
 * 1. If positional arguments are passed in, run those files.
 * 2. If `--suite` is either slow or fast, run slow or fast test.
 * 3. Otherwise, run all spec tests.
 */
if (args.length === 0) {
  if (flags.suite === 'fast') {
    testGlob = 'packages/**/*_spec.ts';
  } else if (flags.suite === 'slow') {
    testGlob = 'packages/**/*_spec_slow.ts';
  } else {
    testGlob = 'packages/**/**/*_spec*';
  }
}

// In CI, use the JUnit reporter to upload results to CircleCI.
// Locally, use the default 'spec' reporter.
const reporterConfig = process.env.CI
  ? {
      reporter: 'mocha-junit-reporter',
      'reporter-option': ['mochaFile=./reports/test_output.xml'],
    }
  : {};

const opts = {
  extension: ['ts'],
  require: ['ts-node/register', path.join(__dirname, 'tools', 'test-setup.ts')],
  spec: testGlob,
  timeout: 800000,
  recursive: true,
  ...reporterConfig,
};

module.exports = opts;

const {
  utils: { fromBuildIdentifier },
} = require('../../../src/api');

module.exports = {
  buildIdentifier: 'beta',
  makers: [],
  publishers: [],
  packagerConfig: { foo: 'bar', baz: {} },
  s3: {},
  electronReleaseServer: {},
  magicFn: () => 'magic result',
  topLevelProp: fromBuildIdentifier({ beta: 'foo' }),
  topLevelUndef: fromBuildIdentifier({ stable: 'heya' }),
  regexp: /foo/,
  sub: {
    prop: {
      inArray: [fromBuildIdentifier({ beta: 'arr' }), 'natural', 'array'],
      deep: {
        prop: fromBuildIdentifier({ beta: 'bar' }),
      },
    },
  },
};

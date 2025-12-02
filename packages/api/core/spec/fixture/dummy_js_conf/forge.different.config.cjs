const {
  utils: { fromBuildIdentifier },
  // eslint-disable-next-line n/no-unpublished-require
} = require('@electron-forge/core');

module.exports = {
  buildIdentifier: 'beta',
  makers: [],
  publishers: [],
  hooks: {
    preStart: () => {
      return 'running preStart hook';
    },
  },
  packagerConfig: { foo: 'bar', baz: {} },
  s3: {},
  electronReleaseServer: {},
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

/* eslint-disable */
// A user config that breaks the plugin's assumption of CommonJS output.
export default {
  build: {
    lib: {
      entry: 'src/main.js',
      formats: ['es'],
    },
  },
};

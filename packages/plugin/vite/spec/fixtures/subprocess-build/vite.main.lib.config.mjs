/* eslint-disable */
export default {
  build: {
    lib: {
      entry: 'src/main.js',
      fileName: (format, entryName) => `custom-${entryName}.${format}`,
      formats: ['cjs'],
    },
  },
};

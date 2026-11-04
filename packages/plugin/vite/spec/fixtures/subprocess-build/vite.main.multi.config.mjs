/* eslint-disable */
export default {
  build: {
    lib: {
      entry: 'src/main.js',
      fileName: (format, entryName) => `${entryName}.${format}`,
      formats: ['es', 'cjs'],
    },
  },
};

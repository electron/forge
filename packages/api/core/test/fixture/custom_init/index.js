const baseTemplate = require('@electron-forge/template-base').default;
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  dependencies: ['debug'],
  devDependencies: ['lodash'],
  initializeTemplate: async (directory) => {
    await baseTemplate.initializeTemplate(directory);
    await fs.copy(path.resolve(__dirname, 'tmpl', '_bar'), path.resolve(directory, '.bar'));
    await fs.copy(path.resolve(__dirname, 'tmpl', 'src'), path.resolve(directory, 'src'));
  },
};

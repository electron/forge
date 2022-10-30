const path = require('path');

const baseTemplate = require('@electron-forge/template-base').default;
const fs = require('fs-extra');

module.exports = {
  requiredForgeVersion: '>= 6.0.0-beta.1',
  dependencies: ['debug'],
  devDependencies: ['lodash'],
  initializeTemplate: async (directory) => {
    const tasks = await baseTemplate.initializeTemplate(directory, {});
    return [
      ...tasks,
      {
        title: 'Adding custom template files',
        task: async () => {
          await fs.copy(path.resolve(__dirname, 'tmpl', '_bar'), path.resolve(directory, '.bar'));
          await fs.copy(path.resolve(__dirname, 'tmpl', 'src'), path.resolve(directory, 'src'));
        },
      },
    ];
  },
};

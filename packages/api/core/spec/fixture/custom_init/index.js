const path = require('path');

const baseTemplate = require('@electron-forge/template-base').default;
const fs = require('fs-extra');

module.exports = {
  requiredForgeVersion: '>= 8.0.0-alpha.0',
  // For testing purposes, let's specify zero-dependency packages
  // and pin the versions
  dependencies: [...baseTemplate.dependencies, 'semver@7.7.3'],
  devDependencies: [...baseTemplate.devDependencies, '@types/semver@7.7.1'],
  initializeTemplate: async (directory) => {
    const tasks = await baseTemplate.initializeTemplate(directory, {});
    return [
      ...tasks,
      {
        title: 'Adding custom template files',
        task: async () => {
          await fs.copy(
            path.resolve(__dirname, 'tmpl', '_bar'),
            path.resolve(directory, '.bar'),
          );
          await fs.copy(
            path.resolve(__dirname, 'tmpl', 'src'),
            path.resolve(directory, 'src'),
          );
        },
      },
    ];
  },
};

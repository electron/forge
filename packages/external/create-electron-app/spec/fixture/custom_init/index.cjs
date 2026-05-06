const fs = require('fs/promises');
const path = require('path');

const baseTemplate = require('@electron-forge/template-base').default;

module.exports = {
  requiredForgeVersion: '>= 8.0.0-alpha.0',
  dependencies: [...baseTemplate.dependencies, 'semver@7.7.3'],
  devDependencies: [...baseTemplate.devDependencies, '@types/semver@7.7.1'],
  initializeTemplate: async (directory) => {
    const tasks = await baseTemplate.initializeTemplate(directory, {});
    return [
      ...tasks,
      {
        title: 'Adding custom template files',
        task: async () => {
          await fs.cp(
            path.resolve(__dirname, 'tmpl', '_bar'),
            path.resolve(directory, '.bar'),
            { recursive: true },
          );
          await fs.cp(
            path.resolve(__dirname, 'tmpl', 'src'),
            path.resolve(directory, 'src'),
            { recursive: true },
          );
        },
      },
    ];
  },
};

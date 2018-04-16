const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;
const PACKAGES_DIR = path.resolve(BASE_DIR, 'packages');

const packages = [];
for (const subDir of fs.readdirSync(PACKAGES_DIR)) {
  for (const packageDir of fs.readdirSync(path.resolve(PACKAGES_DIR, subDir))) {
    const pj = JSON.parse(fs.readFileSync(path.resolve(PACKAGES_DIR, subDir, packageDir, 'package.json')));
    const name = pj.name.substr('@electron-forge/'.length);
    packages.push(name);
  }
}

module.exports = {
  types: [
    {value: 'feat',     name: 'feat:     A new feature'},
    {value: 'fix',      name: 'fix:      A bug fix'},
    {value: 'docs',     name: 'docs:     Documentation only changes'},
    {value: 'style',    name: 'style:    Changes that do not affect the meaning of the code\n            (white-space, formatting, missing semi-colons, etc)'},
    {value: 'refactor', name: 'refactor: A code change that neither fixes a bug nor adds a feature'},
    {value: 'perf',     name: 'perf:     A code change that improves performance'},
    {value: 'test',     name: 'test:     Adding missing tests'},
    {value: 'chore',    name: 'chore:    Changes to the build process or auxiliary tools\n            and libraries such as documentation generation'},
    {value: 'revert',   name: 'revert:   Revert to a commit'},
    {value: 'WIP',      name: 'WIP:      Work in progress'},
  ],
  scopes: packages.map(package => ({ name: package })),
  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
}

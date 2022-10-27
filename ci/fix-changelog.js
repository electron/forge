const fs = require('fs');
const path = require('path');

const prettier = require('prettier');

const changelogPath = path.resolve(__dirname, '..', 'CHANGELOG.md');

const changelog = fs.readFileSync(changelogPath, 'utf8');

const fixedChangelog = changelog
  .replace(/\(([A-Za-z0-9]{8})\)/g, (match, commitID) => `([${commitID}](https://github.com/electron/forge/commit/${commitID}))`)
  .replace(
    /# ([0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+.[0-9]+)?) /g,
    (match, version) => `# [${version}](https://github.com/electron/forge/releases/tag/v${version}) `
  );

fs.writeFileSync(
  changelogPath,
  prettier.format(fixedChangelog, {
    parser: 'markdown',
  })
);

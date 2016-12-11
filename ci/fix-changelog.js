const fs = require('fs');
const path = require('path');

const changelogPath = path.resolve(__dirname, '..', 'CHANGELOG.md');

const changelog = fs.readFileSync(changelogPath, 'utf8');

const fixedChangelog = changelog.replace(/\(([A-Za-z0-9]{8})\)/g,
  (match, commitID) => `([${commitID}](https://github.com/marshallofsound/electron-forge/commit/${commitID}))`
).replace(/#### ([0-9]+\.[0-9]+\.[0-9]+) /g,
  (match, version) => `#### [${version}](https://github.com/MarshallOfSound/electron-forge/releases/tag/v${version}) `
);

fs.writeFileSync(changelogPath, fixedChangelog);

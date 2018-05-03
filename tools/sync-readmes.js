const fetch = require('node-fetch');
const fs = require('fs-extra');
const path = require('path');

const workspaceMappings = {
  maker: {
    wix: 'wix-msi',
    squirrel: 'squirrel.windows',
    snap: 'snapcraft',
  },
  publisher: {},
  plugin: {},
};

const BASE_DIR = path.resolve(__dirname, '..');
const DOCS_BASE = 'https://raw.githubusercontent.com/MarshallOfSound/electron-forge-docs/v6';

const sanitize = (gb) => {
  return gb
    .replace('{% code-tabs %}', '')
    .replace('{% endcode-tabs %}', '')
    .replace(/{% code-tabs-item title=".+?" %}/g, '')
    .replace('{% endcode-tabs-item %}', '')
    .replace('{% endhint %}', '</b>')
    .replace(/{% hint style="(.+?)" %}\n/g, (_, style) => {
      const styleMap = {
        warning: '⚠️',
        info: 'ℹ️',
        danger: '🚨',
      };
      return `${styleMap[style] || 'ℹ️'} <b>`;
    });
};

const sync = async () => {
  for (const workspace of Object.keys(workspaceMappings)) {
    const workspaceDir = path.resolve(BASE_DIR, 'packages', workspace);

    for (const packageName of await fs.readdir(path.resolve(workspaceDir))) {
      const packageKey = workspaceMappings[workspace][packageName] || packageName;

      const r = await fetch(`${DOCS_BASE}/${workspace}s/${packageKey}.md`);
      if (r.status !== 200) continue;

      console.info('Writing README for:', `${path.basename(workspaceDir)}/${packageKey}`);
      const md = sanitize(await r.text());
      await fs.writeFile(path.resolve(workspaceDir, packageName, 'README.md'), md);
    }
  }
};

if (process.mainModule === module) {
  sync().catch(console.error);
}

module.exports = sync;

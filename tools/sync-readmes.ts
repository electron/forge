import fetch from 'node-fetch';
import * as fs from 'fs-extra';
import Listr from 'listr';
import * as path from 'path';

const workspaceMappings: { [space: string]: { [packageName: string]: string | undefined }} = {
  maker: {
    wix: 'wix-msi',
    squirrel: 'squirrel.windows',
    snap: 'snapcraft',
  },
  publisher: {},
  plugin: {},
  api: {
    core: 'does-not-exist-plz-no-readme',
  },
};

const BASE_DIR = path.resolve(__dirname, '..');
const DOCS_BASE = 'https://raw.githubusercontent.com/MarshallOfSound/electron-forge-docs/v6';

function sanitize(gb: string): string {
  return gb
    .replace('{% code-tabs %}', '')
    .replace('{% endcode-tabs %}', '')
    .replace(/{% code-tabs-item title=".+?" %}/g, '')
    .replace('{% endcode-tabs-item %}', '')
    .replace('{% endhint %}', '\n--------')
    .replace(/{% hint style="(.+?)" %}\n/g, (_, style) => {
      const styleMap: { [style: string]: string | undefined } = {
        warning: '⚠️',
        info: 'ℹ️',
        danger: '🚨',
      };
      return `\n--------\n\n${styleMap[style] || 'ℹ️'} `;
    });
}

interface SyncContext {
  packageKeys: [string, string, string, string][];
}

function sync(): Listr {
  return new Listr([
    {
      title: 'Collecting package keys',
      task: async (ctx: SyncContext) => {
        ctx.packageKeys = [];

        for (const workspace of Object.keys(workspaceMappings)) {
          const workspaceDir = path.resolve(BASE_DIR, 'packages', workspace);

          for (const packageName of await fs.readdir(path.resolve(workspaceDir))) {
            const packageKey = workspaceMappings[workspace][packageName] || packageName;

            ctx.packageKeys.push([workspace, workspaceDir, packageKey, packageName]);
          }
        }
      },
    },
    {
      title: 'Fetching READMEs',
      task: (ctx: SyncContext) => new Listr(ctx.packageKeys.map(
        ([workspace, workspaceDir, packageKey, packageName]) => ({
          title: `Fetching README for ${path.basename(workspaceDir)}/${packageKey}`,
          task: async () => {
            let rp: ReturnType<typeof fetch>;
            if (workspace !== 'api') {
              rp = fetch(`${DOCS_BASE}/${workspace}s/${packageKey}.md`);
            } else {
              rp = fetch(`${DOCS_BASE}/${packageKey}.md`);
            }
            const r = await rp;
            if (r.status !== 200) return;

            const md = sanitize(await r.text());
            await fs.writeFile(path.resolve(workspaceDir, packageName, 'README.md'), md);
          },
        }),
      ), { concurrent: 3 }),
    },
  ]);
}

if (require.main === module) {
  sync().run().catch(console.error);
}

module.exports = sync;

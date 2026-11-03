// TypeDoc plugin: connect the API reference to the guides.
//
// - The API landing page (api/index.md) is the hand-written, task-based
//   overview in ./overview.md instead of a flat list of packages.
// - Each maker, publisher and plugin's package page and config page start
//   with a callout linking to its guide (../api-packages.json).
// - Links in package READMEs and TSDoc comments to the old API site
//   (js.electronforge.io) or to electronforge.io become links within this
//   site, which `onBrokenLinks: 'throw'` then checks.
import fs from 'node:fs';
import path from 'node:path';

import { ReflectionKind } from 'typedoc';
import {
  MarkdownPageEvent,
  MarkdownRendererEvent,
} from 'typedoc-plugin-markdown';

const WEBSITE = path.resolve(import.meta.dirname, '..');
const DOCS = path.resolve(WEBSITE, '../docs');
const VERSION = JSON.parse(
  fs.readFileSync(path.resolve(WEBSITE, '../lerna.json'), 'utf8'),
).version;

const catalog = JSON.parse(
  fs.readFileSync(path.join(WEBSITE, 'api-packages.json'), 'utf8'),
);
const entries = Object.fromEntries(
  [catalog.makers, catalog.publishers, catalog.plugins].flatMap((group) =>
    Object.entries(group),
  ),
);

// `config/makers/zip.md` -> { url: '/config/makers/zip/', title: 'ZIP' }
function guide(file) {
  const source = fs.readFileSync(path.join(DOCS, file), 'utf8');
  const title = /^# (.+)$/m.exec(source)?.[1] ?? file;
  return { url: `/${file.replace(/\.mdx?$/, '')}/`, title };
}

const relative = (from, to) => {
  const link = path.posix.relative(path.posix.dirname(from), to);
  return link.startsWith('.') ? link : `./${link}`;
};

export function load(app) {
  // `maker-zip.MakerZIPConfig` -> reflection, for js.electronforge.io links.
  const byName = new Map();
  app.renderer.on(MarkdownRendererEvent.BEGIN, (event) => {
    byName.clear();
    for (const reflection of Object.values(event.project.reflections)) {
      if (!reflection.parent?.kindOf(ReflectionKind.Module)) continue;
      const pkg = reflection.parent.name.replace(/^@electron-forge\//, '');
      byName.set(`${pkg}.${reflection.name}`, reflection);
    }
  });

  app.renderer.on(MarkdownPageEvent.END, (page) => {
    const router = app.renderer.router;
    const url = page.url;

    if (page.model.kindOf(ReflectionKind.Project)) {
      page.contents = fs
        .readFileSync(path.join(import.meta.dirname, 'overview.md'), 'utf8')
        .replace('{{FORGE_VERSION}}', VERSION);
      return;
    }

    page.contents = page.contents
      // https://js.electronforge.io/interfaces/_electron-forge_maker-zip.MakerZIPConfig.html
      .replace(
        /\]\(https:\/\/js\.electronforge\.io\/[a-z]+\/_electron-forge_([\w-]+)\.(?:[\w]+\.)*?(\w+)\.html(#[\w-]*)?\)/g,
        (match, pkg, name, hash = '') => {
          const target = byName.get(`${pkg}.${name}`);
          return target
            ? `](${relative(url, router.getFullUrl(target))}${hash})`
            : match;
        },
      )
      // https://www.electronforge.io/config/makers/msix#usage
      .replace(
        /\]\(https:\/\/(?:www\.)?electronforge\.io\/?([\w./-]*?)\/?(#[\w-]*)?\)/g,
        (_, route, hash = '') => `](/${route ? `${route}/` : ''}${hash})`,
      );

    // Guide callouts on package pages and config pages.
    const name = Object.keys(entries).find(
      (key) => url === `${entries[key].config}.md` || url === `${key}/index.md`,
    );
    if (!name) return;
    const { url: guideUrl, title } = guide(entries[name].guide);
    // Package READMEs already point at their config page, so the callout
    // only adds the guide.
    const line = `[${title}](${guideUrl}) walks through installing and configuring \`@electron-forge/${name}\`.`;
    const callout = [':::tip[Guide]', line, ':::', ''].join('\n');
    // After the front matter and the page heading, if any.
    page.contents = page.contents.replace(
      /^((?:---\n[\s\S]*?\n---\n+)?(?:# .*\n+)?)/,
      (head) => `${head}${callout}\n`,
    );
  });
}

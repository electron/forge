// TypeDoc plugin: API-first landing and package pages.
//
// - The API landing page (api/index.md) is ./overview.md, an index of the
//   types readers look up most, instead of a flat list of packages.
// - Package pages are a summary of the package's API, not a copy of its
//   README (which repeats the guide): a one-line description, the install
//   command, the type you configure it with, and a table of every export
//   with its kind and first sentence of documentation.
// - Links in TSDoc comments to the old API site (js.electronforge.io) or to
//   electronforge.io become links within this site, which
//   `onBrokenLinks: 'throw'` then checks.
import fs from 'node:fs';
import path from 'node:path';

import { ReflectionKind } from 'typedoc';
import {
  MarkdownPageEvent,
  MarkdownRendererEvent,
} from 'typedoc-plugin-markdown';

import { canonicalOf } from './reexports.mjs';

const WEBSITE = path.resolve(import.meta.dirname, '..');
const ROOT = path.resolve(WEBSITE, '..');
const VERSION = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'lerna.json'), 'utf8'),
).version;

const catalog = JSON.parse(
  fs.readFileSync(path.join(WEBSITE, 'api-packages.json'), 'utf8'),
);
const configs = Object.fromEntries(
  [catalog.makers, catalog.publishers, catalog.plugins].flatMap((group) =>
    Object.entries(group).map(([name, entry]) => [name, entry.config]),
  ),
);

const relative = (from, to) => {
  const link = path.posix.relative(path.posix.dirname(from), to);
  return link.startsWith('.') ? link : `./${link}`;
};

// Table cells: one line, pipes escaped, and outside inline code nothing
// MDX would parse as JSX (inside code, MDX shows backslashes as typed).
const cell = (text) =>
  text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(`[^`]*`)/)
    .map((segment, i) =>
      i % 2 ? segment : segment.replace(/[<>{}]/g, (c) => `\\${c}`),
    )
    .join('')
    .replace(/\|/g, '\\|');

// Long types are cut, the page itself has the full declaration.
const code = (text) => {
  const flat = text.replace(/\s+/g, ' ');
  return `\`${flat.length > 70 ? `${flat.slice(0, 69)}…` : flat}\``;
};

const firstSentence = (text) => {
  const match = /^(.+?[.!?])(\s|$)/s.exec(text.trim());
  return match ? match[1] : text.trim();
};

function summaryOf(reflection) {
  const comment =
    reflection.comment ??
    reflection.signatures?.[0]?.comment ??
    reflection.type?.declaration?.signatures?.[0]?.comment;
  if (!comment?.summary?.length) return '';
  // {@link Foo} parts become their text; inline code stays code.
  const text = comment.summary
    .map((part) =>
      part.kind === 'inline-tag' ? `\`${part.text}\`` : part.text,
    )
    .join('');
  return firstSentence(text.split(/\n\s*\n/)[0]);
}

// The README's first paragraph, from the page as rendered (already
// sanitised for MDX), or the package.json description.
function descriptionOf(contents, model) {
  if (model.readme?.length) {
    const body = contents.replace(/^---\n[\s\S]*?\n---\n/, '');
    const paragraph = body
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block && !/^(#|:::|```|<|-|\||>)/.test(block));
    // Plain text: its links point at the guide or at exports listed below.
    if (paragraph) return paragraph.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  }
  const source = model.children?.find((c) => c.sources?.length)?.sources[0];
  const dir = /^(packages\/[^/]+\/[^/]+)\//.exec(source?.fileName ?? '')?.[1];
  const pkgJson = dir && path.join(ROOT, dir, 'package.json');
  return pkgJson && fs.existsSync(pkgJson)
    ? `${JSON.parse(fs.readFileSync(pkgJson, 'utf8')).description}.`
    : '';
}

// What to say about an export without a doc comment.
function fallbackSummary(reflection) {
  if (reflection.kindOf(ReflectionKind.Class)) {
    const base = reflection.extendedTypes?.[0];
    return base ? `Extends ${code(base.toString())}` : '';
  }
  if (reflection.kindOf(ReflectionKind.Interface)) {
    const count = reflection.children?.length ?? 0;
    const base = reflection.extendedTypes?.[0];
    const props = `${count} ${count === 1 ? 'property' : 'properties'}`;
    return base ? `Extends ${code(base.toString())}, ${props}` : props;
  }
  if (reflection.type) return code(reflection.type.toString());
  return '';
}

const npmName = (model) =>
  model.parent?.kindOf(ReflectionKind.Module)
    ? `${model.parent.name}/${model.name}`
    : model.name;

const ORDER = [
  ReflectionKind.Interface,
  ReflectionKind.TypeAlias,
  ReflectionKind.Enum,
  ReflectionKind.Class,
  ReflectionKind.Function,
  ReflectionKind.Variable,
  ReflectionKind.Module,
];

function packagePage(page, router) {
  const model = page.model;
  const url = page.url;
  const name = npmName(model);
  const short = name.replace(/^@electron-forge\//, '').split('/')[0];
  const isPackage = model.parent?.kindOf(ReflectionKind.Project);
  const link = (reflection) =>
    relative(url, router.getFullUrl(canonicalOf(reflection)));

  const exports = (model.children ?? [])
    .filter((child) => !child.kindOf(ReflectionKind.Reference))
    .sort(
      (a, b) =>
        ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) ||
        a.name.localeCompare(b.name),
    );

  const md = [
    '---',
    `title: ${JSON.stringify(name)}`,
    '---',
    '',
    `# ${name}`,
    '',
  ];
  const description = isPackage ? descriptionOf(page.contents, model) : '';
  if (description) md.push(description, '');
  if (isPackage) {
    md.push('```bash', `npm install --save-dev ${name}`, '```', '');
  }

  const config = configs[short];
  const configReflection =
    isPackage &&
    config &&
    exports.find((child) => `${config}.md` === router.getFullUrl(child));
  if (configReflection) {
    md.push(
      '## Configuration',
      '',
      `Pass a [\`${configReflection.name}\`](${link(configReflection)}) object as this package's \`config\`.`,
      '',
    );
    const summary = summaryOf(configReflection);
    if (summary) md.push(`> ${cell(summary)}`, '');
  }

  if (exports.length) {
    md.push(
      '## Exports',
      '',
      '| Name | Kind | Description |',
      '| --- | --- | --- |',
    );
    for (const child of exports) {
      const kind = ReflectionKind.singularString(child.kind);
      const reexport = canonicalOf(child) !== child;
      const description = reexport
        ? `Re-exported from \`${canonicalOf(child).parent?.name}\``
        : summaryOf(child) || fallbackSummary(child);
      md.push(
        `| [\`${child.name}\`](${link(child)}) | ${kind} | ${cell(description)} |`,
      );
    }
    md.push('');
  }
  return md.join('\n');
}

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

    if (page.model.kindOf(ReflectionKind.Module)) {
      page.contents = packagePage(page, router);
      return;
    }

    // An instance of a class (`api`, `utils`) lists what you can call on it.
    const instanceOf = page.model.kindOf(ReflectionKind.Variable)
      ? page.model.type?.reflection
      : undefined;
    if (instanceOf?.kindOf(ReflectionKind.Class)) {
      const classUrl = relative(url, router.getFullUrl(instanceOf));
      const members = (instanceOf.children ?? []).filter(
        (child) =>
          !child.kindOf(ReflectionKind.Constructor) &&
          !child.flags.isPrivate &&
          !child.flags.isProtected,
      );
      const rows = members.map((child) => {
        const deprecated = (child.signatures?.[0] ?? child).comment?.getTag(
          '@deprecated',
        );
        const label = child.signatures ? `${child.name}()` : child.name;
        const name = deprecated ? `~~\`${label}\`~~` : `\`${label}\``;
        const summary = summaryOf(child) || fallbackSummary(child);
        return `| [${name}](${classUrl}#${child.name.toLowerCase()}) | ${cell(
          deprecated ? `Deprecated. ${summary}` : summary,
        )} |`;
      });
      page.contents += [
        '',
        `## Members`,
        '',
        `\`${page.model.name}\` is a [\`${instanceOf.name}\`](${classUrl}).`,
        '',
        '| Member | Description |',
        '| --- | --- |',
        ...rows,
        '',
      ].join('\n');
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
  });
}

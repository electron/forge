import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

import catalog from './api-packages.json';

type SidebarItems = Extract<SidebarsConfig[string], unknown[]>;
type Item = {
  type: string;
  id?: string;
  label?: string;
  className?: string;
  items?: Item[];
  [key: string]: unknown;
};
type PackageEntry = { config: string; guide: string };

// The API sidebar is organised by what readers come to do (configure Forge,
// call it from code, extend it) rather than by npm package. Doc ids come
// from the sidebar docusaurus-plugin-typedoc generates into ./api on each
// build, so a type that is added or renamed shows up without edits here:
// anything not placed explicitly lands in its package's node or, for
// shared-types, under "Shared types".
// eslint-disable-next-line @typescript-eslint/no-require-imports
const generated: Item[] = require('./api/typedoc-sidebar.cjs');

// Re-exported types are stub pages pointing at the declaring package
// (typedoc/reexports.mjs); they stay out of the sidebar.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const reexports = new Set<string>(require('./api/reexports.json'));

const docIds = (items: Item[] = []): string[] =>
  items.flatMap((item) => [
    ...(item.type === 'doc' && item.id ? [item.id] : []),
    // Module (package) pages are category links in the generated sidebar.
    ...(item.link && typeof item.link === 'object' && 'id' in item.link
      ? [String(item.link.id)]
      : []),
    ...docIds(item.items),
  ]);

const allDocs = docIds(generated).filter((id) => !reexports.has(id));
const placed = new Set<string>();

// Kind badges (src/css/theme/api.css), from the kind directory in the id.
const KINDS: Record<string, string> = {
  classes: 'class',
  interfaces: 'interface',
  'type-aliases': 'type',
  variables: 'variable',
  functions: 'function',
  enumerations: 'enum',
  namespaces: 'namespace',
};
const kindOf = (id: string) =>
  KINDS[id.split('/').at(-2) ?? ''] ?? (id.endsWith('index') ? 'module' : '');
const nameOf = (id: string) => id.split('/').at(-1) ?? id;

function doc(id: string, extra: Partial<Item> = {}): Item {
  if (!allDocs.includes(id)) throw new Error(`No API page generated for ${id}`);
  placed.add(id);
  return {
    type: 'doc',
    id,
    label: nameOf(id),
    className: `api-kind api-kind-${kindOf(id)}`,
    ...extra,
  };
}

const docsIn = (prefix: string) =>
  allDocs.filter((id) => id.startsWith(`${prefix}/`) && !placed.has(id));

const category = (
  label: string,
  items: Item[],
  extra: Partial<Item> = {},
): Item => ({
  type: 'category',
  label,
  collapsed: true,
  items,
  ...extra,
});

// Order within a package: interfaces and types first (what you configure),
// then classes, functions and variables, deprecated items last.
const ORDER = ['interface', 'type', 'enum', 'class', 'function', 'variable'];
const byKind = (a: string, b: string) =>
  ORDER.indexOf(kindOf(a)) - ORDER.indexOf(kindOf(b)) ||
  nameOf(a).localeCompare(nameOf(b));

// A maker, publisher or plugin opens on its config page. The rest of the
// package follows, with the class and helpers under "Implementation" and
// the package README last.
function configurable(name: string, entry: PackageEntry, prefix: string): Item {
  const config = doc(entry.config);
  const rest = docsIn(name).filter((id) => !id.endsWith('index'));
  const types = rest.filter((id) =>
    ['interface', 'type', 'enum'].includes(kindOf(id)),
  );
  const implementation = rest.filter((id) => !types.includes(id));
  // plugin-vite has a module page per entry point besides its README.
  const readme = docsIn(name)
    .filter((id) => id.endsWith('index'))
    .sort((a, b) => a.length - b.length);
  return category(
    name.slice(prefix.length),
    [
      { ...config, label: nameOf(entry.config) },
      ...types.sort(byKind).map((id) => doc(id)),
      ...(implementation.length
        ? [
            category(
              'Implementation',
              implementation.sort(byKind).map((id) => doc(id)),
              { className: 'api-implementation' },
            ),
          ]
        : []),
      ...readme.map((id) =>
        id === `${name}/index`
          ? doc(id, { label: 'Package README', className: 'api-readme' })
          : doc(id, { label: id.split('/').at(-2) }),
      ),
    ],
    { link: { type: 'doc', id: entry.config } },
  );
}

const group = (
  label: string,
  entries: Record<string, PackageEntry>,
  prefix: string,
) =>
  category(
    label,
    Object.entries(entries).map(([name, entry]) =>
      configurable(name, entry, prefix),
    ),
  );

// A base package's pages, with its README last.
const packageDocs = (name: string): Item[] => [
  ...docsIn(name)
    .filter((id) => id !== `${name}/index`)
    .sort(byKind)
    .map((id) => doc(id)),
  doc(`${name}/index`, { label: `${name} README`, className: 'api-readme' }),
];

// Links from the "Extending Forge" groups to their guides.
const guideLink = (label: string, href: string): Item => ({
  type: 'link',
  label: `Guide: ${label}`,
  href,
  className: 'api-readme',
});

const shared = (name: string) => `shared-types/${name}`;

const sidebars: SidebarsConfig = {
  api: [
    { type: 'doc', id: 'index', label: 'Overview' },
    category(
      'Configuration',
      [
        doc(shared('type-aliases/ForgeConfig')),
        doc(shared('interfaces/ForgePackagerOptions')),
        doc(shared('interfaces/ForgeRebuildOptions')),
        doc(shared('interfaces/ForgeLoggerOptions')),
        group('Makers', catalog.makers, 'maker-'),
        group('Publishers', catalog.publishers, 'publisher-'),
        group('Plugins', catalog.plugins, 'plugin-'),
      ],
      { collapsed: false },
    ),
    category(
      'Programmatic API',
      [
        doc('core/classes/ForgeAPI'),
        doc('core/variables/api'),
        category('Options', [
          doc('core/interfaces/MakeOptions'),
          doc('core/interfaces/PackageOptions'),
          doc('core/type-aliases/PublishOptions'),
          doc(shared('interfaces/StartOptions')),
          doc('core/interfaces/ReleaseOptions'),
        ]),
        category('Results', [
          doc(shared('interfaces/ForgeMakeResult')),
          doc(shared('interfaces/ForgePackageResult')),
          doc(shared('interfaces/ElectronProcess')),
          doc(shared('type-aliases/StartResult')),
        ]),
        ...docsIn('core')
          .filter((id) => id !== 'core/index')
          .sort(byKind)
          .map((id) => doc(id)),
        doc('core/index', { label: 'Package README', className: 'api-readme' }),
      ],
      { link: { type: 'doc', id: 'core/classes/ForgeAPI' } },
    ),
    category('Extending Forge', [
      category('Hooks', [
        guideLink('Hooks', '/config/hooks/'),
        doc(shared('type-aliases/ForgeHookMap')),
        doc(shared('interfaces/ForgeSimpleHookSignatures')),
        doc(shared('interfaces/ForgeMutatingHookSignatures')),
        doc(shared('type-aliases/ForgeHookName')),
        doc(shared('type-aliases/ForgeHookFn')),
        doc(shared('type-aliases/ForgeSimpleHookFn')),
        doc(shared('type-aliases/ForgeMutatingHookFn')),
        doc(shared('type-aliases/ForgeMultiHookMap')),
      ]),
      category('Writing a maker', [
        guideLink(
          'Writing makers',
          '/advanced/extending-electron-forge/writing-makers/',
        ),
        ...packageDocs('maker-base'),
        doc(shared('interfaces/IForgeMaker')),
      ]),
      category('Writing a publisher', [
        guideLink(
          'Writing publishers',
          '/advanced/extending-electron-forge/writing-publishers/',
        ),
        ...packageDocs('publisher-base'),
        ...packageDocs('publisher-static'),
        doc(shared('interfaces/IForgePublisher')),
      ]),
      category('Writing a plugin', [
        guideLink(
          'Writing plugins',
          '/advanced/extending-electron-forge/writing-plugins/',
        ),
        ...packageDocs('plugin-base'),
        doc(shared('interfaces/IForgePlugin')),
        doc(shared('interfaces/IForgePluginInterface')),
      ]),
      category('Writing a template', [
        guideLink(
          'Writing templates',
          '/advanced/extending-electron-forge/writing-templates/',
        ),
        doc(shared('interfaces/ForgeTemplate')),
        doc(shared('interfaces/InitTemplateOptions')),
      ]),
    ]),
    // Everything in shared-types not placed above.
    category('Shared types', [
      ...docsIn('shared-types')
        .filter((id) => !id.endsWith('index'))
        .sort(byKind)
        .map((id) => doc(id)),
      doc('shared-types/index', {
        label: 'Package README',
        className: 'api-readme',
      }),
    ]),
  ] as SidebarItems,
};

// Fail the build rather than silently dropping pages from the sidebar.
const missing = allDocs.filter((id) => !placed.has(id) && id !== 'index');
if (missing.length) {
  throw new Error(
    `API pages missing from sidebars-api.ts: ${missing.join(', ')}`,
  );
}

export default sidebars;

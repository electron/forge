import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';

import lucentPrism from './src/prism/lucent';

// This site renders the Markdown/MDX content in `../docs` at the site root.
// It is a standalone Yarn project (own lockfile) and not a monorepo workspace.

const config: Config = {
  title: 'Electron Forge',
  tagline: 'Quickly scaffold an Electron project with a full build pipeline',

  url: 'https://forge.electronjs.org',
  baseUrl: '/',
  // Azure static websites only serve `<dir>/index.html` reliably for requests
  // ending in `/`, and paths with a dot (e.g. `makers/squirrel.windows`) would
  // otherwise look like files. Emit and link every route with a trailing slash.
  trailingSlash: true,

  organizationName: 'electron',
  projectName: 'forge',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',
  favicon: 'img/favicon.svg',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  // `../docs/static` holds images referenced from the docs (e.g. `/img/image.png`).
  staticDirectories: ['../docs/static', 'static'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  future: {
    v4: true,
    faster: true,
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          // `docPath` is relative to `docs.path`, so this maps to `docs/<file>` in the repo.
          editUrl: ({ docPath }) =>
            `https://github.com/electron/forge/edit/main/docs/${docPath}`,
          showLastUpdateTime: false,
        },
        blog: false,
        // Only the homepage (src/pages/index.tsx); docs live at the root too.
        pages: {},
        theme: {
          customCss: [
            // Mermaid's `fa:` node icons are Font Awesome classes it doesn't ship.
            require.resolve('@fortawesome/fontawesome-free/css/all.min.css'),
            './src/css/custom.css',
          ],
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    [
      // Offline (build-time) search index; no external search service needed.
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexBlog: false,
        indexPages: false,
        docsRouteBasePath: '/',
        docsDir: '../docs',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  themeConfig: {
    // Lucent colours come from custom.css; these only set Mermaid's layout
    // defaults and the base each mode starts from.
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Electron Forge',
      logo: {
        alt: '',
        src: 'img/mark.svg',
        srcDark: 'img/mark-dark.svg',
      },
      items: [
        {
          to: '/getting-started/',
          label: 'Docs',
          position: 'left',
          // Every route but the homepage is a docs page.
          activeBaseRegex: '^/.+',
        },
        {
          // TODO: switch to packages.electronjs.org/forge/latest/ once the API
          // docs move there (electron/forge#4385)
          href: 'https://js.electronforge.io/',
          label: 'API',
          position: 'right',
        },
        {
          href: 'https://www.electronjs.org/',
          label: 'electronjs.org',
          position: 'right',
        },
        {
          href: 'https://github.com/electron/forge',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting started', to: '/getting-started/' },
            { label: 'CLI', to: '/cli/' },
            { label: 'Configuration', to: '/config/configuration/' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'GitHub', href: 'https://github.com/electron/forge' },
            { label: 'Discord', href: 'https://discord.gg/electronjs' },
          ],
        },
        {
          title: 'Electron',
          items: [
            { label: 'electronjs.org', href: 'https://www.electronjs.org/' },
            { label: 'Fiddle', href: 'https://www.electronjs.org/fiddle' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} OpenJS Foundation and Electron contributors.`,
    },
    prism: {
      // One theme for both modes: its colours are Lucent CSS variables.
      theme: lucentPrism,
      darkTheme: lucentPrism,
      additionalLanguages: ['bash', 'json', 'diff'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

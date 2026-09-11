import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This site renders the Markdown/MDX content in `../docs` at the site root.
// It is a standalone Yarn project (own lockfile) and not a monorepo workspace.

const config: Config = {
  title: 'Electron Forge',
  tagline: 'Quickly scaffold an Electron project with a full build pipeline',
  favicon: 'img/icon.png',

  url: 'https://forge.electronjs.org',
  baseUrl: '/',

  organizationName: 'electron',
  projectName: 'forge',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
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
            `https://github.com/electron/forge/edit/next/docs/${docPath}`,
          showLastUpdateTime: false,
        },
        blog: false,
        pages: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Electron Forge',
      logo: {
        alt: 'Electron Forge logo',
        src: 'img/icon.png',
      },
      items: [
        { to: '/', label: 'Docs', position: 'left', activeBaseRegex: '.*' },
        {
          href: 'https://packages.electronjs.org/forge/latest/',
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
          title: 'Links',
          items: [
            { label: 'electronjs.org', href: 'https://www.electronjs.org/' },
            { label: 'GitHub', href: 'https://github.com/electron/forge' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} OpenJS Foundation and Electron contributors.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'diff'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

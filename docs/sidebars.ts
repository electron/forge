import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'index',
    'import-existing-project',
    'cli',
    {
      type: 'category',
      label: 'Core Concepts',
      collapsible: false,
      items: [
        {
          type: 'doc',
          id: 'core-concepts/why-electron-forge',
          label: 'Why Electron Forge?',
        },
        'core-concepts/build-lifecycle',
      ],
    },
    {
      type: 'category',
      label: 'Configuration',
      collapsible: false,
      items: [
        {
          type: 'doc',
          id: 'config/configuration',
          label: 'Configuration Overview',
        },
        'config/typescript-configuration',
        {
          type: 'category',
          label: 'Plugins',
          link: { type: 'doc', id: 'config/plugins/index' },
          items: [
            'config/plugins/webpack',
            'config/plugins/vite',
            'config/plugins/electronegativity',
            'config/plugins/auto-unpack-natives',
            'config/plugins/local-electron',
            'config/plugins/fuses',
          ],
        },
        {
          type: 'category',
          label: 'Makers',
          link: { type: 'doc', id: 'config/makers/index' },
          items: [
            'config/makers/appx',
            'config/makers/deb',
            'config/makers/dmg',
            'config/makers/flatpak',
            'config/makers/msix',
            'config/makers/pkg',
            'config/makers/rpm',
            'config/makers/snapcraft',
            'config/makers/squirrel.windows',
            'config/makers/wix-msi',
            'config/makers/zip',
          ],
        },
        {
          type: 'category',
          label: 'Publishers',
          link: { type: 'doc', id: 'config/publishers/index' },
          items: [
            'config/publishers/bitbucket',
            'config/publishers/electron-release-server',
            'config/publishers/github',
            'config/publishers/gcs',
            'config/publishers/nucleus',
            'config/publishers/s3',
            'config/publishers/snapcraft',
          ],
        },
        'config/hooks',
      ],
    },
    {
      type: 'category',
      label: 'Built-in Templates',
      collapsible: false,
      items: [
        'templates/webpack-template',
        'templates/typescript-+-webpack-template',
        'templates/vite',
        'templates/vite-+-typescript',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsible: false,
      items: [
        {
          type: 'category',
          label: 'Code Signing',
          link: { type: 'doc', id: 'guides/code-signing/index' },
          items: [
            'guides/code-signing/code-signing-windows',
            'guides/code-signing/code-signing-macos',
          ],
        },
        'guides/create-and-add-icons',
        {
          type: 'category',
          label: 'Framework Integration',
          link: { type: 'doc', id: 'guides/framework-integration/index' },
          items: [
            'guides/framework-integration/parcel',
            'guides/framework-integration/react',
            'guides/framework-integration/react-with-typescript',
            'guides/framework-integration/vue-3',
          ],
        },
        'guides/developing-with-wsl',
      ],
    },
    {
      type: 'category',
      label: 'Advanced',
      collapsible: false,
      items: [
        'advanced/auto-update',
        'advanced/debugging',
        {
          type: 'category',
          label: 'Extending Electron Forge',
          link: { type: 'doc', id: 'advanced/extending-electron-forge/index' },
          items: [
            'advanced/extending-electron-forge/writing-plugins',
            'advanced/extending-electron-forge/writing-templates',
            'advanced/extending-electron-forge/writing-makers',
            'advanced/extending-electron-forge/writing-publishers',
          ],
        },
        {
          type: 'link',
          label: 'API Docs',
          href: 'https://js.electronforge.io/modules/_electron_forge_core.html',
        },
      ],
    },
  ],
};

export default sidebars;

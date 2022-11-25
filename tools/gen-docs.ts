import * as path from 'path';

import * as typedoc from 'typedoc';

import { getPackageInfo } from './utils';

function generatedSidebarGroups(projReflection: typedoc.ProjectReflection) {
  const maker = new typedoc.ReflectionGroup('Makers');
  const plugin = new typedoc.ReflectionGroup('Plugins');
  const publisher = new typedoc.ReflectionGroup('Publishers');
  const template = new typedoc.ReflectionGroup('Templates');
  const util = new typedoc.ReflectionGroup('Utils & Internal Helpers');

  const keys = ['maker', 'plugin', 'publisher', 'template', 'util'];
  const groups = [maker, plugin, publisher, template, util];

  for (const child of projReflection.groups![0].children) {
    const key = keys.find((k) => child.name.includes(k));
    if (key && !child.name.includes('maker-base')) {
      const group = groups.find((t) => t.title.toLowerCase().includes(key))!;
      group.children.push(child);
    } else {
      util.children.push(child);
    }
  }
  return groups;
}

(async () => {
  const packages = await getPackageInfo();

  const typedocApp = new typedoc.Application();
  typedocApp.bootstrap({
    entryPointStrategy: 'packages',
    entryPoints: packages.filter((pkg) => !!pkg.manifest.main).map((pkg) => pkg.path),
    excludeExternals: false,
    excludeInternal: true,
    excludePrivate: true,
    excludeProtected: true,
    hideGenerator: true,
    name: 'Electron Forge',
    plugin: [
      'typedoc-plugin-resolve-crossmodule-references',
      'typedoc-plugin-rename-defaults',
      './tools/doc-plugin/dist/index.js',
      '@knodes/typedoc-plugin-monorepo-readmes',
    ],
    theme: 'forge-theme',
  });

  const projReflection = typedocApp.convert();
  if (projReflection === undefined) {
    throw new Error('Failed to find package sources');
  }
  projReflection.groups = generatedSidebarGroups(projReflection);

  await typedocApp.generateDocs(projReflection, path.resolve(__dirname, '..', 'docs'));
})().catch(console.error);

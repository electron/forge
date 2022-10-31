import * as path from 'path';

import * as typedoc from 'typedoc';

import { getPackageInfo } from './utils';

function generatedSidebarGroups(projReflection: typedoc.ProjectReflection) {
  const maker = new typedoc.ReflectionGroup('Makers', 2);
  const plugin = new typedoc.ReflectionGroup('Plugins', 2);
  const publisher = new typedoc.ReflectionGroup('Publishers', 2);
  const template = new typedoc.ReflectionGroup('Templates', 2);
  const util = new typedoc.ReflectionGroup('Utils & Internal Helpers', 2);

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
    excludeExternals: true,
    excludeInternal: true,
    excludePrivate: true,
    excludeProtected: true,
    externalPattern: ['**/node_modules/@types/node/**', '**/node_modules/typescript/**'],
    hideGenerator: true,
    includeVersion: true,
    name: 'Electron Forge',
    plugin: ['typedoc-plugin-rename-defaults', 'typedoc-plugin-missing-exports', './tools/doc-plugin/dist/index.js', '@knodes/typedoc-plugin-monorepo-readmes'],
    theme: 'forge-theme',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (overloaded param `internalModule` lets us rename "<internal>"
    // in the generated docs to "InternalOptions")
    internalModule: 'InternalOptions',
  });

  const projReflection = typedocApp.convert();
  if (projReflection === undefined) {
    throw new Error('Failed to find package sources');
  }
  projReflection.groups = generatedSidebarGroups(projReflection);

  await typedocApp.generateDocs(projReflection, path.resolve(__dirname, '..', 'docs'));
})().catch(console.error);

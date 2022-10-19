import * as path from 'path';
import { getPackageInfo } from './utils';
import * as typedoc from 'typedoc';

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
    plugin: ['typedoc-plugin-rename-defaults', 'typedoc-plugin-missing-exports', './tools/doc-plugin/dist/index.js'],
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
  const makers = new typedoc.ReflectionGroup('Makers', 2);
  const plugins = new typedoc.ReflectionGroup('Plugins', 2);
  const publishers = new typedoc.ReflectionGroup('Publishers', 2);
  const templates = new typedoc.ReflectionGroup('Templates', 2);
  const utils = new typedoc.ReflectionGroup('Utils', 2);

  for (const child of projReflection.groups![0].children) {
    if (child.name.includes('maker')) {
      makers.children.push(child);
    } else if (child.name.includes('plugin')) {
      plugins.children.push(child);
    } else if (child.name.includes('publisher')) {
      publishers.children.push(child);
    } else if (child.name.includes('template')) {
      templates.children.push(child);
    } else {
      utils.children.push(child);
    }
  }

  projReflection.groups = [makers, plugins, publishers, templates, utils];

  await typedocApp.generateDocs(projReflection, path.resolve(__dirname, '..', 'docs'));
})().catch(console.error);

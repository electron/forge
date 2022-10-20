import * as path from 'path';
import { getPackageInfo } from './utils';
import * as typedoc from 'typedoc';

(async () => {
  const packages = await getPackageInfo();

  const typedocApp = new typedoc.Application();
  typedocApp.bootstrap({
    entryPointStrategy: 'packages',
    entryPoints: packages.filter((pkg) => !!pkg.manifest['main']).map((pkg) => pkg.path),
    excludeExternals: true,
    excludeInternal: true,
    excludePrivate: true,
    excludeProtected: true,
    externalPattern: ['**/node_modules/@types/node/**'],
    hideGenerator: true,
    includeVersion: true,
    name: 'Electron Forge',
    plugin: ['typedoc-plugin-rename-defaults', 'typedoc-plugin-missing-exports'],
  });

  const projReflection = typedocApp.convert();
  if (projReflection === undefined) {
    throw new Error('Failed to find package sources');
  }

  await typedocApp.generateDocs(projReflection, path.resolve(__dirname, '..', 'docs'));
})().catch(console.error);

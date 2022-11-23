import { promises as fs } from 'fs';
import * as path from 'path';

import { getPackageInfo } from './utils';

/**
 * Filters out non-unique items in an array.
 */
function filterDupes<T>(arr: readonly T[]): T[] {
  return Array.from(new Set(arr));
}

(async () => {
  const BASE_TS_CONFIG = JSON.parse(await fs.readFile(path.resolve(__dirname, '../tsconfig.base.json'), 'utf-8'));
  const packages = await getPackageInfo();

  const rootPackagesConfig = {
    files: [],
    references: packages.map((p) => ({ path: p.path.split('/packages/')[1] })),
  };

  fs.writeFile(path.resolve(__dirname, '../packages/tsconfig.json'), JSON.stringify(rootPackagesConfig, null, 2));

  // Do each package in parallel
  await Promise.all(
    packages.map((pkg) => {
      // Carve out a subset of types on the package manifest object
      const pkgManifest = pkg.manifest as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };

      // Figure out which other local packages this package references
      const pkgDeps = [pkgManifest.dependencies, pkgManifest.devDependencies].flatMap((deps) => (deps === undefined ? [] : Object.keys(deps)));
      const refs = filterDupes(
        pkgDeps.flatMap((depName) => {
          const depPkg = packages.find((maybeDepPkg) => maybeDepPkg.name === depName);
          return depPkg === undefined ? [] : [depPkg];
        })
      );

      // Map each package this package references to a typescript project reference
      const tsRefs = refs.map((depPkg) => ({
        path: path.relative(pkg.path, depPkg.path),
      }));

      // Create the typescript config object
      const tsConfig = Object.assign({}, BASE_TS_CONFIG, {
        references: tsRefs,
      });
      Object.assign(tsConfig.compilerOptions, {
        typeRoots: [
          path.relative(pkg.path, path.resolve(__dirname, '..', 'typings')),
          path.relative(pkg.path, path.resolve(__dirname, '..', 'node_modules', '@types')),
        ],
      });

      // Write the typescript config to the package dir
      const tsConfigPath = path.join(pkg.path, 'tsconfig.json');
      return fs.writeFile(tsConfigPath, JSON.stringify(tsConfig, undefined, 2));
    })
  );
})().catch(console.error);

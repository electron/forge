import { promises as fs } from 'node:fs';
import * as path from 'node:path';

import { getPackageInfo } from './utils';

/**
 * Filters out non-unique items in an array.
 */
function filterDupes<T>(arr: readonly T[]): T[] {
  return Array.from(new Set(arr));
}

(async () => {
  const BASE_TS_CONFIG = JSON.parse(
    await fs.readFile(
      path.resolve(import.meta.dirname, '../tsconfig.base.json'),
      'utf-8',
    ),
  );
  const packages = await getPackageInfo();

  // Generate a root tsconfig.json for project references
  const rootPackagesConfig = {
    files: [],
    references: packages.map((p) => {
      const pathArr = p.path.split(path.sep);
      const pathFromPackages = pathArr
        .slice(pathArr.indexOf('packages') + 1)
        .join(path.sep);
      return {
        path: pathFromPackages,
      };
    }),
  };

  fs.writeFile(
    path.resolve(import.meta.dirname, '../packages/tsconfig.json'),
    JSON.stringify(rootPackagesConfig, null, 2),
  );

  // Do each package in parallel
  await Promise.all(
    packages.map((pkg) => {
      // Carve out a subset of types on the package manifest object
      const pkgManifest = pkg.manifest as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };

      // Figure out which other local packages this package references
      const pkgDeps = [
        pkgManifest.dependencies,
        pkgManifest.devDependencies,
      ].flatMap((deps) => (deps === undefined ? [] : Object.keys(deps)));
      const refs = filterDupes(
        pkgDeps.flatMap((depName) => {
          const depPkg = packages.find(
            (maybeDepPkg) => maybeDepPkg.name === depName,
          );
          return depPkg === undefined ? [] : [depPkg];
        }),
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
          path.relative(
            pkg.path,
            path.resolve(import.meta.dirname, '..', 'typings'),
          ),
          path.relative(
            pkg.path,
            path.resolve(import.meta.dirname, '..', 'node_modules', '@types'),
          ),
        ],
      });

      // Write the typescript config to the package dir
      const tsConfigPath = path.join(pkg.path, 'tsconfig.json');
      return fs.writeFile(tsConfigPath, JSON.stringify(tsConfig, undefined, 2));
    }),
  );
})().catch(console.error);

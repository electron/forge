import path from 'node:path';

import fs from 'fs-extra';

export interface Dependency {
  name: string;
  path: SourceAndDestination;
  dependencies: Dependency[];
}

export interface SourceAndDestination {
  src: string;
  dest: string;
}

function isRootPath(dir: string) {
  // *unix or Windows root path
  return dir === '/' || /^[a-zA-Z]:\\$/i.test(dir);
}

export async function isDirectory(p: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(p);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function lookupNodeModulesPaths(root: string, paths: string[] = []): Promise<string[]> {
  if (!root) return paths;
  if (!path.isAbsolute(root)) return paths;

  const p = path.join(root, 'node_modules');

  if (await isDirectory(p)) {
    paths = paths.concat(p);
  }
  root = path.join(root, '..');

  return isRootPath(root) ? paths : await lookupNodeModulesPaths(root, paths);
}

export async function resolveDependencies(root: string) {
  const rootDependencies = Object.keys((await fs.readJson(path.join(root, 'package.json'))).dependencies || {});
  const resolve = async (prePath: string, dependencies: string[], collected: Map<string, Dependency> = new Map()) =>
    await Promise.all(
      dependencies.map(async (name) => {
        let curPath = prePath,
          depPath = null,
          packageJson = null;
        while (!packageJson && !isRootPath(curPath)) {
          const allNodeModules = await lookupNodeModulesPaths(curPath);

          for (const nodeModules of allNodeModules) {
            depPath = path.join(nodeModules, name);
            if (await fs.pathExists(depPath)) break;
          }

          if (depPath) {
            try {
              packageJson = await fs.readJson(path.join(depPath, 'package.json'));
            } catch (err) {
              // lookup node_modules
              curPath = path.join(curPath, '..');
              if (curPath.length < root.length) {
                console.error(`not found 'node_modules' in root path: ${root}`);
                throw err;
              }
            }
          }
        }

        if (!depPath || !packageJson) {
          throw new Error(`find dependencies error in: ${curPath}`);
        }

        const result: Dependency = {
          name,
          path: {
            src: depPath,
            dest: path.relative(root, depPath),
          },
          dependencies: [],
        };
        const shouldResolveDeps = !collected.has(depPath);
        collected.set(depPath, result);
        if (shouldResolveDeps) {
          result.dependencies = await resolve(depPath, Object.keys(packageJson.dependencies || {}), collected);
        }
        return result;
      })
    );
  return resolve(root, rootDependencies);
}

export async function getFlatDependencies(root = process.cwd()) {
  const depsTree = await resolveDependencies(root);
  const depsFlat = new Map<string, SourceAndDestination>();

  const flatten = (dep: Dependency) => {
    depsFlat.set(dep.path.src, dep.path); // dedup
    dep.dependencies.forEach(flatten);
  };
  depsTree.forEach(flatten);

  return [...depsFlat.values()];
}

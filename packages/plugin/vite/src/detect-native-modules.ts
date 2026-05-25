import fs from 'node:fs';
import path from 'node:path';

import debug from 'debug';

const d = debug('electron-forge:plugin:vite:native-modules');

const NATIVE_DEPENDENCY_MARKERS = [
  'bindings',
  'node-gyp-build',
  'prebuild-install',
];

function readJsonSafe(filePath: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export function isNativePackage(pkgDir: string): boolean {
  if (fs.existsSync(path.join(pkgDir, 'binding.gyp'))) return true;

  if (fs.existsSync(path.join(pkgDir, 'prebuilds'))) return true;

  try {
    const files = fs.readdirSync(path.join(pkgDir, 'build', 'Release'));
    if (files.some((f) => f.endsWith('.node'))) return true;
  } catch {
    // Directory doesn't exist or isn't readable
  }

  const pkg = readJsonSafe(path.join(pkgDir, 'package.json'));
  if (pkg) {
    const deps = Object.keys(
      (pkg.dependencies as Record<string, string>) ?? {},
    );
    if (deps.some((dep) => NATIVE_DEPENDENCY_MARKERS.includes(dep))) {
      return true;
    }
  }

  return false;
}

export function detectNativePackages(projectDir: string): string[] {
  const nodeModulesDir = path.join(projectDir, 'node_modules');
  if (!fs.existsSync(nodeModulesDir)) return [];

  const results: string[] = [];

  let entries: string[];
  try {
    entries = fs.readdirSync(nodeModulesDir);
  } catch {
    return [];
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;

    if (entry.startsWith('@')) {
      const scopeDir = path.join(nodeModulesDir, entry);
      let scopeEntries: string[];
      try {
        scopeEntries = fs.readdirSync(scopeDir);
      } catch {
        continue;
      }
      for (const sub of scopeEntries) {
        const name = `${entry}/${sub}`;
        if (isNativePackage(path.join(scopeDir, sub))) {
          results.push(name);
        }
      }
    } else {
      if (isNativePackage(path.join(nodeModulesDir, entry))) {
        results.push(entry);
      }
    }
  }

  d('detected native packages:', results);
  return results;
}

export function walkTransitiveDependencies(
  projectDir: string,
  packages: string[],
): Set<string> {
  const all = new Set(packages);
  const queue = [...packages];

  while (queue.length > 0) {
    const pkg = queue.pop()!;
    const pkgJson = readJsonSafe(
      path.join(projectDir, 'node_modules', pkg, 'package.json'),
    );
    if (!pkgJson) continue;

    for (const dep of Object.keys(
      (pkgJson.dependencies as Record<string, string>) ?? {},
    )) {
      if (!all.has(dep)) {
        all.add(dep);
        queue.push(dep);
      }
    }
  }

  d('native packages with transitive deps:', [...all]);
  return all;
}

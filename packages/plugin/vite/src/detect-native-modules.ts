import fs from 'node:fs';
import path from 'node:path';

import debug from 'debug';

const d = debug('electron-forge:plugin:vite:native-modules');

const NATIVE_DEPENDENCY_MARKERS = [
  'bindings',
  'node-gyp-build',
  'prebuild-install',
];

export function isNativePackage(pkgDir: string): boolean {
  if (fs.existsSync(path.join(pkgDir, 'binding.gyp'))) return true;

  if (fs.existsSync(path.join(pkgDir, 'prebuilds'))) return true;

  const buildRelease = path.join(pkgDir, 'build', 'Release');
  if (fs.existsSync(buildRelease)) {
    try {
      const files = fs.readdirSync(buildRelease);
      if (files.some((f) => f.endsWith('.node'))) return true;
    } catch {
      /* ignore read errors */
    }
  }

  const pkgJsonPath = path.join(pkgDir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      const deps = Object.keys(pkg.dependencies ?? {});
      if (deps.some((dep) => NATIVE_DEPENDENCY_MARKERS.includes(dep))) {
        return true;
      }
    } catch {
      /* ignore parse errors */
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

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

/**
 * Resolve symlinks so that packages installed through symlinking package
 * managers (pnpm's default layout, or `npm link`ed packages) are inspected at
 * their real location. Falls back to the input path if it cannot be resolved.
 */
function realpathSafe(p: string): string {
  try {
    return fs.realpathSync(p);
  } catch {
    return p;
  }
}

/**
 * Resolve the on-disk directory of a dependency the way Node's module
 * resolution does: look in `fromDir/node_modules/<name>` first, then walk up
 * the ancestor directories checking each `node_modules` along the way.
 *
 * This handles npm conflict-nesting (nested node_modules), monorepo/workspace
 * hoisting (dependencies installed above the project root), and — because
 * `fromDir` is resolved to its real path — pnpm's virtual store layout, where
 * a package's dependencies live in a sibling `node_modules` inside `.pnpm`.
 */
export function resolvePackageDir(
  fromDir: string,
  name: string,
): string | null {
  let dir = realpathSafe(fromDir);
  for (;;) {
    // Node never looks inside node_modules/node_modules.
    if (path.basename(dir) !== 'node_modules') {
      const candidate = path.join(dir, 'node_modules', name);
      if (fs.existsSync(candidate)) {
        return realpathSafe(candidate);
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

function hasNodeFileInDir(dir: string): boolean {
  try {
    return fs.readdirSync(dir).some((f) => f.endsWith('.node'));
  } catch {
    return false;
  }
}

/**
 * Whether a package looks like a platform-specific prebuilt binary package —
 * the convention used by napi-rs and similar tooling, where the JS entry
 * package lists per-platform packages in `optionalDependencies` (e.g.
 * `sharp` → `@img/sharp-darwin-arm64`, `libsql` → `@libsql/darwin-arm64`,
 * `@parcel/watcher` → `@parcel/watcher-linux-x64-glibc`).
 */
export function isNapiPlatformPackage(pkgDir: string): boolean {
  const pkg = readJsonSafe(path.join(pkgDir, 'package.json'));

  // e.g. @libsql/darwin-arm64 has `"main": "index.node"`.
  if (pkg && typeof pkg.main === 'string' && pkg.main.endsWith('.node')) {
    return true;
  }

  // A `.node` binary shipped at the package root.
  if (hasNodeFileInDir(pkgDir)) {
    return true;
  }

  // Platform packages constrain `os` + `cpu` and may nest the binary one
  // level deep (e.g. @img/sharp-darwin-arm64 ships lib/sharp-*.node).
  if (pkg && Array.isArray(pkg.os) && Array.isArray(pkg.cpu)) {
    try {
      for (const entry of fs.readdirSync(pkgDir, { withFileTypes: true })) {
        if (
          !entry.isDirectory() ||
          entry.name.startsWith('.') ||
          entry.name === 'node_modules'
        ) {
          continue;
        }
        if (hasNodeFileInDir(path.join(pkgDir, entry.name))) {
          return true;
        }
      }
    } catch {
      // Directory isn't readable
    }
  }

  return false;
}

export function isNativePackage(pkgDir: string): boolean {
  // Follow symlinks (pnpm layout, npm link) to the real package contents.
  pkgDir = realpathSafe(pkgDir);

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
    // napi-rs projects declare a `napi` config block in package.json.
    if (pkg.napi != null) return true;

    const deps = Object.keys(
      (pkg.dependencies as Record<string, string>) ?? {},
    );
    if (deps.some((dep) => NATIVE_DEPENDENCY_MARKERS.includes(dep))) {
      return true;
    }

    // Prebuilt-binary convention: platform-specific packages listed as
    // optionalDependencies. Packages for other platforms are routinely not
    // installed, so any that fail to resolve are skipped.
    const optionalDeps = Object.keys(
      (pkg.optionalDependencies as Record<string, string>) ?? {},
    );
    for (const dep of optionalDeps) {
      const depDir = resolvePackageDir(pkgDir, dep);
      if (depDir && isNapiPlatformPackage(depDir)) {
        return true;
      }
    }
  }

  return false;
}

let warnedAboutPnpm = false;

export function detectNativePackages(projectDir: string): string[] {
  const nodeModulesDir = path.join(projectDir, 'node_modules');
  if (!fs.existsSync(nodeModulesDir)) return [];

  if (!warnedAboutPnpm && fs.existsSync(path.join(nodeModulesDir, '.pnpm'))) {
    warnedAboutPnpm = true;
    console.warn(
      '[@electron-forge/plugin-vite] Detected a pnpm-style symlinked node_modules layout. ' +
        'Native module detection follows the top-level symlinks, but support for pnpm layouts is limited: ' +
        'transitive dependencies of native modules that only exist inside the .pnpm virtual store may not be copied into the packaged app. ' +
        'If native dependencies are missing at runtime, set node-linker=hoisted in your .npmrc.',
    );
  }

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
  const queue: { name: string; dir: string | null }[] = packages.map(
    (name) => ({
      name,
      dir: resolvePackageDir(projectDir, name),
    }),
  );

  while (queue.length > 0) {
    const { dir } = queue.pop()!;
    if (!dir) continue;

    const pkgJson = readJsonSafe(path.join(dir, 'package.json'));
    if (!pkgJson) continue;

    const enqueue = (
      deps: Record<string, string> | undefined,
      optional: boolean,
    ) => {
      for (const dep of Object.keys(deps ?? {})) {
        if (all.has(dep)) continue;
        const depDir = resolvePackageDir(dir, dep);
        if (!depDir && optional) {
          // Optional dependencies for other platforms/architectures are
          // routinely absent from the install — skip them silently.
          continue;
        }
        all.add(dep);
        queue.push({ name: dep, dir: depDir });
      }
    };

    enqueue(pkgJson.dependencies as Record<string, string> | undefined, false);
    enqueue(
      pkgJson.optionalDependencies as Record<string, string> | undefined,
      true,
    );
  }

  d('native packages with transitive deps:', [...all]);
  return all;
}

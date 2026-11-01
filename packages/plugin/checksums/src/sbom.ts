import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface SbomPackage {
  name: string;
  version: string;
  license?: string;
}

/**
 * Walks a packaged app's `node_modules` folder (including scoped and nested
 * `node_modules`) and returns every package found, de-duplicated by
 * name and version.
 */
export async function collectPackages(
  buildPath: string,
): Promise<SbomPackage[]> {
  const found = new Map<string, SbomPackage>();

  async function readPackage(dir: string): Promise<void> {
    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(
        await fs.readFile(path.join(dir, 'package.json'), 'utf-8'),
      );
    } catch {
      return;
    }
    if (
      typeof manifest.name === 'string' &&
      typeof manifest.version === 'string'
    ) {
      const key = `${manifest.name}@${manifest.version}`;
      if (!found.has(key)) {
        found.set(key, {
          name: manifest.name,
          version: manifest.version,
          license: normalizeLicense(manifest.license),
        });
      }
    }
    await walkNodeModules(path.join(dir, 'node_modules'));
  }

  async function walkNodeModules(nodeModulesDir: string): Promise<void> {
    let entries: import('node:fs').Dirent[];
    try {
      entries = await fs.readdir(nodeModulesDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const entryPath = path.join(nodeModulesDir, entry.name);
      if (entry.name.startsWith('@')) {
        const scoped = await fs.readdir(entryPath, { withFileTypes: true });
        for (const scopedEntry of scoped) {
          if (scopedEntry.isDirectory()) {
            await readPackage(path.join(entryPath, scopedEntry.name));
          }
        }
      } else {
        await readPackage(entryPath);
      }
    }
  }

  await walkNodeModules(path.join(buildPath, 'node_modules'));
  return [...found.values()].sort((a, b) =>
    a.name === b.name
      ? a.version.localeCompare(b.version)
      : a.name.localeCompare(b.name),
  );
}

function normalizeLicense(license: unknown): string | undefined {
  if (typeof license === 'string' && license.trim()) return license.trim();
  if (
    license &&
    typeof license === 'object' &&
    typeof (license as { type?: unknown }).type === 'string'
  ) {
    return (license as { type: string }).type;
  }
  return undefined;
}

export function npmPurl(name: string, version: string): string {
  const encodedName = name.startsWith('@') ? `%40${name.slice(1)}` : name;
  return `pkg:npm/${encodedName}@${encodeURIComponent(version)}`;
}

interface BuildSbomOptions {
  appName: string;
  appVersion: string;
  electronVersion?: string;
  packages: SbomPackage[];
  toolVersion: string;
  timestamp?: Date;
}

/**
 * Builds a CycloneDX 1.5 JSON document.
 */
export function buildSbom({
  appName,
  appVersion,
  electronVersion,
  packages,
  toolVersion,
  timestamp = new Date(),
}: BuildSbomOptions): Record<string, unknown> {
  const appRef = npmPurl(appName, appVersion);
  const components: Record<string, unknown>[] = [];

  if (electronVersion) {
    components.push({
      type: 'framework',
      name: 'electron',
      version: electronVersion,
      purl: npmPurl('electron', electronVersion),
      'bom-ref': npmPurl('electron', electronVersion),
      licenses: [{ license: { id: 'MIT' } }],
    });
  }

  for (const pkg of packages) {
    const purl = npmPurl(pkg.name, pkg.version);
    components.push({
      type: 'library',
      name: pkg.name,
      version: pkg.version,
      purl,
      'bom-ref': purl,
      ...(pkg.license ? { licenses: [{ expression: pkg.license }] } : {}),
    });
  }

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:${randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: timestamp.toISOString(),
      tools: {
        components: [
          {
            type: 'application',
            name: '@electron-forge/plugin-checksums',
            version: toolVersion,
          },
        ],
      },
      component: {
        type: 'application',
        name: appName,
        version: appVersion,
        'bom-ref': appRef,
      },
    },
    components,
    dependencies: [
      {
        ref: appRef,
        dependsOn: components.map((c) => c['bom-ref'] as string),
      },
    ],
  };
}

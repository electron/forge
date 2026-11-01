import { createHash } from 'node:crypto';
import { createReadStream, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import { PluginBase } from '@electron-forge/plugin-base';
import {
  ForgeArch,
  ForgeHookFn,
  ForgeHookMap,
  ForgeMakeResult,
  ForgePlatform,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import debug from 'debug';

import { ChecksumAlgorithm, ChecksumsPluginConfig } from './Config.js';
import { buildSbom, collectPackages, SbomPackage } from './sbom.js';

const d = debug('electron-forge:plugin:checksums');

const CHECKSUM_FILE_PREFIX: Record<ChecksumAlgorithm, string> = {
  sha256: 'SHA256SUMS',
  sha512: 'SHA512SUMS',
};

function readOwnVersion(): string {
  try {
    const manifest = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
    );
    return manifest.version;
  } catch {
    return '0.0.0';
  }
}

export async function hashFile(
  filePath: string,
  algorithm: ChecksumAlgorithm,
): Promise<string> {
  const hash = createHash(algorithm);
  await pipeline(createReadStream(filePath), hash);
  return hash.digest('hex');
}

/**
 * Formats checksum lines the way `sha256sum` / `shasum -a 256` print them,
 * so users can verify downloads with `sha256sum -c`.
 */
export function formatChecksumFile(
  entries: { hash: string; name: string }[],
): string {
  return (
    entries
      .map(({ hash, name }) => `${hash}  ${name}`)
      .sort((a, b) =>
        a.slice(a.indexOf('  ')).localeCompare(b.slice(b.indexOf('  '))),
      )
      .join('\n') + '\n'
  );
}

function targetKey(platform: ForgePlatform | string, arch: ForgeArch | string) {
  return `${platform}-${arch}`;
}

function safeFileName(name: string): string {
  return name.replace(/^@/, '').replace(/[/\\]/g, '-');
}

export default class ChecksumsPlugin extends PluginBase<ChecksumsPluginConfig> {
  name = 'checksums';

  private projectDir = process.cwd();

  /** Packages found in each packaged build, keyed by `${platform}-${arch}`. */
  private packagesByTarget = new Map<string, SbomPackage[]>();

  private electronVersionByTarget = new Map<string, string>();

  init(dir: string, config: ResolvedForgeConfig): void {
    super.init(dir, config);
    this.projectDir = dir;
  }

  getHooks(): ForgeHookMap {
    return {
      packageAfterPrune: this.packageAfterPrune,
      postMake: this.postMake,
    };
  }

  private get algorithm(): ChecksumAlgorithm {
    return this.config.algorithm ?? 'sha256';
  }

  private get sbomEnabled(): boolean {
    return this.config.sbom ?? true;
  }

  packageAfterPrune: ForgeHookFn<'packageAfterPrune'> = async (
    _forgeConfig,
    buildPath,
    electronVersion,
    platform,
    arch,
  ) => {
    if (!this.sbomEnabled) return;
    const key = targetKey(platform, arch);
    this.packagesByTarget.set(key, await collectPackages(buildPath));
    this.electronVersionByTarget.set(key, electronVersion);
    d('collected', this.packagesByTarget.get(key)?.length, 'packages for', key);
  };

  private lookupTarget<T>(
    map: Map<string, T>,
    platform: string,
    arch: string,
  ): T | undefined {
    const exact = map.get(targetKey(platform, arch));
    if (exact) return exact;
    // Universal macOS builds are packaged as x64 + arm64 and merged, so fall
    // back to any build for the same platform.
    for (const [key, value] of map) {
      if (key.startsWith(`${platform}-`)) return value;
    }
    return undefined;
  }

  postMake: ForgeHookFn<'postMake'> = async (forgeConfig, makeResults) => {
    const groups = new Map<string, ForgeMakeResult[]>();
    for (const result of makeResults) {
      const key = targetKey(result.platform, result.arch);
      groups.set(key, [...(groups.get(key) ?? []), result]);
    }

    const extraResults: ForgeMakeResult[] = [];
    const outDir = path.resolve(this.projectDir, forgeConfig.outDir || 'out');

    for (const [key, results] of groups) {
      const { platform, arch, packageJSON } = results[0];
      const targetDir = path.join(outDir, 'make', 'checksums', key);
      await fs.mkdir(targetDir, { recursive: true });

      const files: string[] = [];
      for (const result of results) {
        for (const artifact of result.artifacts) {
          const stat = await fs.stat(artifact).catch(() => null);
          if (stat?.isFile()) {
            files.push(artifact);
          } else {
            d('skipping non-file artifact', artifact);
          }
        }
      }

      const newArtifacts: string[] = [];

      if (this.sbomEnabled) {
        const packages = this.lookupTarget(
          this.packagesByTarget,
          platform,
          arch,
        );
        if (packages) {
          const appName = packageJSON?.name ?? 'app';
          const appVersion = packageJSON?.version ?? '0.0.0';
          const sbomPath = path.join(
            targetDir,
            `${safeFileName(appName)}-${appVersion}-${key}.cdx.json`,
          );
          const sbom = buildSbom({
            appName,
            appVersion,
            electronVersion: this.lookupTarget(
              this.electronVersionByTarget,
              platform,
              arch,
            ),
            packages,
            toolVersion: readOwnVersion(),
          });
          await fs.writeFile(sbomPath, JSON.stringify(sbom, null, 2) + '\n');
          files.push(sbomPath);
          newArtifacts.push(sbomPath);
        } else {
          console.warn(
            `[plugin-checksums] No package data for ${key}, skipping the SBOM. ` +
              'This happens with `make --from-package`; run a full `make` to generate it.',
          );
        }
      }

      const baseNames = files.map((f) => path.basename(f));
      const hasDuplicateNames = new Set(baseNames).size !== baseNames.length;
      const entries = await Promise.all(
        files.map(async (file) => ({
          hash: await hashFile(file, this.algorithm),
          name: hasDuplicateNames
            ? path
                .relative(path.join(outDir, 'make'), file)
                .split(path.sep)
                .join('/')
            : path.basename(file),
        })),
      );

      const checksumPath = path.join(
        targetDir,
        `${CHECKSUM_FILE_PREFIX[this.algorithm]}-${key}.txt`,
      );
      await fs.writeFile(checksumPath, formatChecksumFile(entries));
      newArtifacts.push(checksumPath);

      extraResults.push({
        artifacts: newArtifacts,
        packageJSON,
        platform,
        arch,
        maker: 'checksums',
      });
    }

    return [...makeResults, ...extraResults];
  };
}

export { ChecksumsPlugin, ChecksumsPluginConfig };

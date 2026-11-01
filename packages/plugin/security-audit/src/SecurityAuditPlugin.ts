import { readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { PluginBase } from '@electron-forge/plugin-base';
import {
  ForgeHookFn,
  ForgeHookMap,
  ForgePlatform,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import debug from 'debug';

import {
  auditFuses,
  auditSources,
  Finding,
  formatReport,
  toSarif,
} from './audit.js';
import { SecurityAuditPluginConfig } from './Config.js';

const d = debug('electron-forge:plugin:security-audit');

function readOwnVersion(): string {
  try {
    return JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf-8'),
    ).version;
  } catch {
    return '0.0.0';
  }
}

/**
 * Path of the Electron binary inside a build folder, before Packager renames
 * it to the app's name (the same lookup plugin-fuses uses).
 */
export function electronBinaryPath(
  buildPath: string,
  platform: ForgePlatform,
): string {
  const base = path.resolve(buildPath, '../..');
  if (platform === 'darwin' || platform === 'mas') {
    return path.join(base, 'MacOS', 'Electron');
  }
  return path.join(base, platform === 'win32' ? 'electron.exe' : 'electron');
}

export default class SecurityAuditPlugin extends PluginBase<SecurityAuditPluginConfig> {
  name = 'security-audit';

  private projectDir = process.cwd();

  constructor(config: SecurityAuditPluginConfig = {}) {
    super(config ?? {});
  }

  init(dir: string, config: ResolvedForgeConfig): void {
    super.init(dir, config);
    this.projectDir = dir;
  }

  getHooks(): ForgeHookMap {
    return {
      packageAfterPrune: this.packageAfterPrune,
    };
  }

  /**
   * Runs after pruning, so the scan sees exactly the files that ship, while
   * they are still loose files (before the ASAR archive is built). Fuses
   * flipped by plugin-fuses in packageAfterCopy are already applied here.
   */
  packageAfterPrune: ForgeHookFn<'packageAfterPrune'> = async (
    forgeConfig,
    buildPath,
    _electronVersion,
    platform,
    arch,
  ) => {
    const {
      failOn = 'error',
      rules = {},
      ignore = [],
      checkFuses = true,
    } = this.config;
    const label = `${platform}-${arch}`;

    const findings: Finding[] = await auditSources(buildPath, {
      ignore,
      rules,
    });

    if (checkFuses) {
      const binary = electronBinaryPath(buildPath, platform);
      try {
        findings.push(
          ...(await auditFuses(binary, {
            asar: Boolean(forgeConfig.packagerConfig?.asar),
            rules,
          })),
        );
      } catch (err) {
        d('could not read fuses from %s: %O', binary, err);
        console.warn(
          `[plugin-security-audit] Could not read fuses from ${binary}; skipping fuse checks.`,
        );
      }
    }

    console.log(formatReport(findings, label));

    if (this.config.sarifOutput) {
      const sarifPath = path.resolve(
        this.projectDir,
        this.config.sarifOutput
          .replaceAll('{platform}', platform)
          .replaceAll('{arch}', arch),
      );
      await fs.mkdir(path.dirname(sarifPath), { recursive: true });
      await fs.writeFile(
        sarifPath,
        JSON.stringify(toSarif(findings, readOwnVersion()), null, 2) + '\n',
      );
    }

    const failing = findings.filter((f) =>
      failOn === 'never'
        ? false
        : failOn === 'warning'
          ? true
          : f.severity === 'error',
    );
    if (failing.length > 0) {
      throw new Error(
        `Security audit found ${failing.length} issue(s) at or above "${failOn}" for ${label}. ` +
          'Fix them, or change their severity with the plugin\'s "rules" option.',
      );
    }
  };
}

export { SecurityAuditPlugin, SecurityAuditPluginConfig };

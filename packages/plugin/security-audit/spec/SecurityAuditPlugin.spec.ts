import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { FuseState, FuseV1Options } from '@electron/fuses';
import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { auditFuses, auditSources, toSarif } from '../src/audit';
import {
  electronBinaryPath,
  SecurityAuditPlugin,
} from '../src/SecurityAuditPlugin';

vi.mock(import('@electron/fuses'), async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, getCurrentFuseWire: vi.fn() };
});

const { getCurrentFuseWire } = await import('@electron/fuses');

async function write(root: string, rel: string, contents: string) {
  const p = path.join(root, rel);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, contents);
}

describe('auditSources', () => {
  let app: string;

  beforeEach(async () => {
    app = await fs.mkdtemp(path.join(os.tmpdir(), 'forge-audit-'));
  });

  afterEach(async () => {
    await fs.rm(app, { recursive: true, force: true });
  });

  it('finds insecure webPreferences in readable and minified code', async () => {
    await write(
      app,
      '.vite/build/main.cjs',
      [
        'const win = new BrowserWindow({',
        '  webPreferences: { nodeIntegration: true, contextIsolation: false },',
        '});',
        'new BrowserWindow({webPreferences:{webSecurity:!1,sandbox:!1,"allowRunningInsecureContent":!0}});',
        "win.loadURL('http://example.com');",
        "win.loadURL('http://localhost:5173');",
        "app.commandLine.appendSwitch('ignore-certificate-errors');",
      ].join('\n'),
    );
    const findings = await auditSources(app);
    expect(findings.map((f) => [f.ruleId, f.severity, f.line])).toEqual([
      ['node-integration', 'error', 2],
      ['context-isolation-disabled', 'error', 2],
      ['sandbox-disabled', 'warning', 4],
      ['web-security-disabled', 'error', 4],
      ['insecure-content-allowed', 'error', 4],
      ['insecure-url', 'warning', 5],
      ['insecure-command-line-switch', 'error', 7],
    ]);
  });

  it('does not flag safe settings or similar identifiers', async () => {
    await write(
      app,
      'main.js',
      'new BrowserWindow({webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,myNodeIntegration:true,nodeIntegrationX:!0}})',
    );
    expect(await auditSources(app)).toEqual([]);
  });

  it('skips node_modules and ignored paths', async () => {
    await write(app, 'node_modules/dep/index.js', 'x={nodeIntegration:true}');
    await write(app, 'vendor/legacy.js', 'x={nodeIntegration:true}');
    await write(app, 'tools/one.js', 'x={nodeIntegration:true}');
    const findings = await auditSources(app, {
      ignore: ['vendor/', 'tools/one.js'],
    });
    expect(findings).toEqual([]);
  });

  it('flags HTML without a CSP unless a script sets the header', async () => {
    await write(app, 'index.html', '<html><head></head></html>');
    await write(
      app,
      'safe.html',
      `<meta http-equiv="Content-Security-Policy" content="default-src 'self'">`,
    );
    await write(
      app,
      'eval.html',
      `<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-eval'">`,
    );
    let findings = await auditSources(app);
    expect(findings.map((f) => [f.ruleId, f.file])).toEqual([
      ['unsafe-eval-csp', 'eval.html'],
      ['missing-csp', 'index.html'],
    ]);

    await write(
      app,
      'main.js',
      `headers['Content-Security-Policy'] = ["default-src 'self'"]`,
    );
    findings = await auditSources(app);
    expect(findings.map((f) => f.ruleId)).toEqual(['unsafe-eval-csp']);
  });

  it('lets rules be turned off or re-graded', async () => {
    await write(app, 'main.js', 'x={nodeIntegration:true,sandbox:false}');
    const findings = await auditSources(app, {
      rules: { 'node-integration': 'off', 'sandbox-disabled': 'error' },
    });
    expect(findings.map((f) => [f.ruleId, f.severity])).toEqual([
      ['sandbox-disabled', 'error'],
    ]);
  });
});

describe('auditFuses', () => {
  it('reports risky fuses, and ASAR fuses only when ASAR is on', async () => {
    vi.mocked(getCurrentFuseWire).mockResolvedValue({
      version: '1',
      [FuseV1Options.RunAsNode]: FuseState.ENABLE,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: FuseState.DISABLE,
      [FuseV1Options.EnableNodeCliInspectArguments]: FuseState.DISABLE,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: FuseState.DISABLE,
      [FuseV1Options.OnlyLoadAppFromAsar]: FuseState.ENABLE,
      [FuseV1Options.GrantFileProtocolExtraPrivileges]: FuseState.DISABLE,
    } as never);
    expect(
      (await auditFuses('electron', { asar: true })).map((f) => f.ruleId),
    ).toEqual(['fuse-run-as-node', 'fuse-asar-integrity']);
    expect(
      (await auditFuses('electron', { asar: false })).map((f) => f.ruleId),
    ).toEqual(['fuse-run-as-node']);
  });
});

describe('toSarif', () => {
  it('emits a SARIF 2.1.0 log with locations and only the rules used', () => {
    const sarif = toSarif(
      [
        {
          ruleId: 'node-integration',
          severity: 'error',
          message: 'm',
          helpUri: 'u',
          file: 'main.js',
          line: 3,
          column: 5,
        },
        {
          ruleId: 'fuse-run-as-node',
          severity: 'warning',
          message: 'f',
          helpUri: 'u',
        },
      ],
      '1.0.0',
    ) as {
      version: string;
      runs: {
        tool: { driver: { rules: { id: string }[] } };
        results: { locations?: { physicalLocation: unknown }[] }[];
      }[];
    };
    expect(sarif.version).toEqual('2.1.0');
    expect(
      sarif.runs[0].tool.driver.rules.map((r: { id: string }) => r.id),
    ).toEqual(['node-integration', 'fuse-run-as-node']);
    expect(sarif.runs[0].results[0].locations?.[0].physicalLocation).toEqual({
      artifactLocation: { uri: 'main.js' },
      region: { startLine: 3, startColumn: 5 },
    });
    expect(sarif.runs[0].results[1].locations).toBeUndefined();
  });
});

describe('SecurityAuditPlugin', () => {
  let tmp: string;
  let buildPath: string;
  const forgeConfig = {
    packagerConfig: { asar: true },
  } as unknown as ResolvedForgeConfig;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'forge-audit-plugin-'));
    buildPath = path.join(tmp, 'build', 'resources', 'app');
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.mocked(getCurrentFuseWire).mockResolvedValue({ version: '1' } as never);
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  function run(config = {}) {
    const plugin = new SecurityAuditPlugin(config);
    plugin.init(tmp, forgeConfig);
    return plugin.getHooks().packageAfterPrune!(
      forgeConfig,
      buildPath,
      '40.0.0',
      'linux',
      'x64',
    );
  }

  it('reads fuses from the unrenamed Electron binary', () => {
    expect(
      electronBinaryPath('/a/Electron.app/Contents/Resources/app', 'darwin'),
    ).toEqual(path.resolve('/a/Electron.app/Contents/MacOS/Electron'));
    expect(electronBinaryPath('/a/resources/app', 'win32')).toEqual(
      path.resolve('/a/electron.exe'),
    );
    expect(electronBinaryPath('/a/resources/app', 'linux')).toEqual(
      path.resolve('/a/electron'),
    );
  });

  it('fails on errors by default, and passes on warnings', async () => {
    await write(buildPath, 'main.js', 'x={sandbox:false}');
    await expect(run()).resolves.toBeUndefined();
    await write(buildPath, 'main.js', 'x={nodeIntegration:true}');
    await expect(run()).rejects.toThrow(
      /1 issue\(s\) at or above "error" for linux-x64/,
    );
  });

  it('honours failOn and writes SARIF', async () => {
    await write(buildPath, 'main.js', 'x={sandbox:false,nodeIntegration:true}');
    await expect(run({ failOn: 'warning' })).rejects.toThrow(/2 issue/);
    await expect(
      run({
        failOn: 'never',
        sarifOutput: 'reports/audit-{platform}-{arch}.sarif',
      }),
    ).resolves.toBeUndefined();
    const sarif = JSON.parse(
      await fs.readFile(
        path.join(tmp, 'reports', 'audit-linux-x64.sarif'),
        'utf-8',
      ),
    );
    expect(sarif.runs[0].results).toHaveLength(2);
  });

  it('warns instead of failing when fuses cannot be read', async () => {
    await write(buildPath, 'main.js', '');
    vi.mocked(getCurrentFuseWire).mockRejectedValue(new Error('no binary'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(run()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('skipping fuse checks'),
    );
  });
});

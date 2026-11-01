import fs from 'node:fs/promises';
import path from 'node:path';

import { FuseState, getCurrentFuseWire } from '@electron/fuses';

import { RuleSetting, Severity } from './Config.js';
import {
  CSP_META_PATTERN,
  FUSE_RULES,
  MISSING_CSP_RULE,
  SOURCE_RULES,
} from './rules.js';

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  helpUri: string;
  /** Path relative to the app folder, with forward slashes. */
  file?: string;
  line?: number;
  column?: number;
}

const SCRIPT_EXTENSIONS = new Set(['.js', '.cjs', '.mjs']);
const HTML_EXTENSIONS = new Set(['.html', '.htm']);

function isIgnored(relativePath: string, ignore: string[]): boolean {
  return ignore.some((entry) =>
    entry.endsWith('/')
      ? relativePath.startsWith(entry)
      : relativePath === entry,
  );
}

async function listFiles(root: string, ignore: string[]): Promise<string[]> {
  const files: string[] = [];
  async function walk(dir: string): Promise<void> {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || isIgnored(`${rel}/`, ignore)) {
          continue;
        }
        await walk(full);
      } else if (entry.isFile() && !isIgnored(rel, ignore)) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SCRIPT_EXTENSIONS.has(ext) || HTML_EXTENSIONS.has(ext)) {
          files.push(rel);
        }
      }
    }
  }
  await walk(root);
  return files.sort();
}

function position(
  text: string,
  index: number,
): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < index; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: index - lineStart + 1 };
}

function resolveSeverity(
  ruleId: string,
  defaultSeverity: Severity,
  overrides: Record<string, RuleSetting>,
): Severity | undefined {
  const setting = overrides[ruleId] ?? defaultSeverity;
  return setting === 'off' ? undefined : setting;
}

/**
 * Scans the app's own scripts and HTML (not `node_modules`) for insecure
 * Electron settings.
 */
export async function auditSources(
  appDir: string,
  {
    ignore = [],
    rules = {},
  }: { ignore?: string[]; rules?: Record<string, RuleSetting> } = {},
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const files = await listFiles(appDir, ignore);
  const htmlWithoutCsp: string[] = [];
  let scriptSetsCspHeader = false;

  for (const file of files) {
    const text = await fs.readFile(path.join(appDir, file), 'utf-8');
    const kind = HTML_EXTENSIONS.has(path.extname(file).toLowerCase())
      ? 'html'
      : 'script';

    if (kind === 'script' && /Content-Security-Policy/i.test(text)) {
      scriptSetsCspHeader = true;
    }
    if (kind === 'html' && !CSP_META_PATTERN.test(text)) {
      htmlWithoutCsp.push(file);
    }

    for (const rule of SOURCE_RULES) {
      if (rule.appliesTo !== kind) continue;
      const severity = resolveSeverity(rule.id, rule.severity, rules);
      if (!severity) continue;
      rule.pattern.lastIndex = 0;
      for (const match of text.matchAll(rule.pattern)) {
        findings.push({
          ruleId: rule.id,
          severity,
          message: rule.description,
          helpUri: rule.helpUri,
          file,
          ...position(text, match.index ?? 0),
        });
      }
    }
  }

  const cspSeverity = resolveSeverity(
    MISSING_CSP_RULE.id,
    MISSING_CSP_RULE.severity,
    rules,
  );
  if (cspSeverity && !scriptSetsCspHeader) {
    for (const file of htmlWithoutCsp) {
      findings.push({
        ruleId: MISSING_CSP_RULE.id,
        severity: cspSeverity,
        message: MISSING_CSP_RULE.description,
        helpUri: MISSING_CSP_RULE.helpUri,
        file,
      });
    }
  }

  return findings;
}

/**
 * Reads the fuse wire of a packaged Electron binary and reports risky fuses.
 */
export async function auditFuses(
  electronBinary: string,
  { asar, rules = {} }: { asar: boolean; rules?: Record<string, RuleSetting> },
): Promise<Finding[]> {
  const wire = (await getCurrentFuseWire(electronBinary)) as unknown as Record<
    number,
    FuseState
  >;
  const findings: Finding[] = [];
  for (const rule of FUSE_RULES) {
    if (rule.requiresAsar && !asar) continue;
    const severity = resolveSeverity(rule.id, rule.severity, rules);
    if (!severity) continue;
    if (wire[rule.fuse] === rule.flaggedState) {
      findings.push({
        ruleId: rule.id,
        severity,
        message: rule.description,
        helpUri: rule.helpUri,
      });
    }
  }
  return findings;
}

const ALL_RULES = [
  ...SOURCE_RULES.map(({ id, description, helpUri }) => ({
    id,
    description,
    helpUri,
  })),
  MISSING_CSP_RULE,
  ...FUSE_RULES.map(({ id, description, helpUri }) => ({
    id,
    description,
    helpUri,
  })),
];

/** Formats findings as a SARIF 2.1.0 log for GitHub code scanning. */
export function toSarif(findings: Finding[], toolVersion: string): object {
  const usedRules = ALL_RULES.filter((rule) =>
    findings.some((f) => f.ruleId === rule.id),
  );
  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: '@electron-forge/plugin-security-audit',
            version: toolVersion,
            informationUri:
              'https://www.electronforge.io/config/plugins/security-audit',
            rules: usedRules.map((rule) => ({
              id: rule.id,
              shortDescription: { text: rule.description },
              helpUri: rule.helpUri,
            })),
          },
        },
        results: findings.map((finding) => ({
          ruleId: finding.ruleId,
          level: finding.severity,
          message: { text: finding.message },
          ...(finding.file
            ? {
                locations: [
                  {
                    physicalLocation: {
                      artifactLocation: { uri: finding.file },
                      ...(finding.line
                        ? {
                            region: {
                              startLine: finding.line,
                              startColumn: finding.column,
                            },
                          }
                        : {}),
                    },
                  },
                ],
              }
            : {}),
        })),
      },
    ],
  };
}

export function formatReport(findings: Finding[], label: string): string {
  if (findings.length === 0) {
    return `Security audit (${label}): no findings`;
  }
  const errors = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.length - errors;
  const lines = findings.map((f) => {
    const where = f.file
      ? `${f.file}${f.line ? `:${f.line}:${f.column}` : ''}`
      : 'Electron binary';
    return `  ${f.severity === 'error' ? 'error  ' : 'warning'}  ${f.ruleId}  ${where}\n           ${f.message} ${f.helpUri}`;
  });
  return [
    `Security audit (${label}): ${errors} error(s), ${warnings} warning(s)`,
    ...lines,
  ].join('\n');
}

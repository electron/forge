export type Severity = 'error' | 'warning';

export type RuleSetting = Severity | 'off';

export interface SecurityAuditPluginConfig {
  /**
   * Fail packaging when a finding at this severity or above is found.
   * `'never'` only prints the report.
   *
   * @defaultValue 'error'
   */
  failOn?: Severity | 'never';
  /**
   * Override the severity of individual rules, or turn them off.
   *
   * @example
   * ```js
   * { rules: { 'sandbox-disabled': 'off', 'missing-csp': 'error' } }
   * ```
   */
  rules?: Record<string, RuleSetting>;
  /**
   * Paths to skip, relative to the app folder. A trailing `/` skips a whole
   * folder. `node_modules/` is always skipped.
   */
  ignore?: string[];
  /**
   * Check the Electron fuses in the packaged binary.
   *
   * @defaultValue true
   */
  checkFuses?: boolean;
  /**
   * Also write the findings as a SARIF 2.1.0 file (for GitHub code scanning),
   * relative to the project directory. `{platform}` and `{arch}` are replaced.
   */
  sarifOutput?: string;
}

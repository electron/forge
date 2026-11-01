import { FuseState, FuseV1Options } from '@electron/fuses';

import { Severity } from './Config.js';

const SECURITY_DOCS =
  'https://www.electronjs.org/docs/latest/tutorial/security';
const FUSES_DOCS = 'https://www.electronjs.org/docs/latest/tutorial/fuses';

// Matches `true` and the minified `!0`, not followed by an identifier char.
const TRUE = String.raw`(?:true|!0)(?![\w$])`;
const FALSE = String.raw`(?:false|!1)(?![\w$])`;
// Matches an object key, quoted or not, followed by a colon.
const key = (name: string) => String.raw`(?<![\w$])["']?${name}["']?\s*:\s*`;

export interface SourceRule {
  id: string;
  severity: Severity;
  description: string;
  helpUri: string;
  /** Files the rule applies to. */
  appliesTo: 'script' | 'html';
  pattern: RegExp;
}

export const SOURCE_RULES: SourceRule[] = [
  {
    id: 'node-integration',
    severity: 'error',
    description:
      'nodeIntegration is enabled, giving web content full Node.js access.',
    helpUri: `${SECURITY_DOCS}#2-do-not-enable-nodejs-integration-for-remote-content`,
    appliesTo: 'script',
    pattern: new RegExp(key('nodeIntegration') + TRUE, 'g'),
  },
  {
    id: 'node-integration-in-subframes',
    severity: 'warning',
    description: 'nodeIntegrationInSubFrames is enabled.',
    helpUri: `${SECURITY_DOCS}#2-do-not-enable-nodejs-integration-for-remote-content`,
    appliesTo: 'script',
    pattern: new RegExp(key('nodeIntegrationInSubFrames') + TRUE, 'g'),
  },
  {
    id: 'node-integration-in-worker',
    severity: 'warning',
    description: 'nodeIntegrationInWorker is enabled.',
    helpUri: `${SECURITY_DOCS}#2-do-not-enable-nodejs-integration-for-remote-content`,
    appliesTo: 'script',
    pattern: new RegExp(key('nodeIntegrationInWorker') + TRUE, 'g'),
  },
  {
    id: 'context-isolation-disabled',
    severity: 'error',
    description:
      'contextIsolation is disabled, so preload scripts share globals with web content.',
    helpUri: `${SECURITY_DOCS}#3-enable-context-isolation`,
    appliesTo: 'script',
    pattern: new RegExp(key('contextIsolation') + FALSE, 'g'),
  },
  {
    id: 'sandbox-disabled',
    severity: 'warning',
    description: 'The renderer sandbox is disabled.',
    helpUri: `${SECURITY_DOCS}#4-enable-process-sandboxing`,
    appliesTo: 'script',
    pattern: new RegExp(key('sandbox') + FALSE, 'g'),
  },
  {
    id: 'web-security-disabled',
    severity: 'error',
    description: 'webSecurity is disabled, turning off the same-origin policy.',
    helpUri: `${SECURITY_DOCS}#6-do-not-disable-websecurity`,
    appliesTo: 'script',
    pattern: new RegExp(key('webSecurity') + FALSE, 'g'),
  },
  {
    id: 'insecure-content-allowed',
    severity: 'error',
    description:
      'allowRunningInsecureContent is enabled, allowing HTTP content on HTTPS pages.',
    helpUri: `${SECURITY_DOCS}#8-do-not-enable-allowrunninginsecurecontent`,
    appliesTo: 'script',
    pattern: new RegExp(key('allowRunningInsecureContent') + TRUE, 'g'),
  },
  {
    id: 'experimental-features',
    severity: 'warning',
    description: 'experimentalFeatures is enabled.',
    helpUri: `${SECURITY_DOCS}#9-do-not-enable-experimental-features`,
    appliesTo: 'script',
    pattern: new RegExp(key('experimentalFeatures') + TRUE, 'g'),
  },
  {
    id: 'blink-features',
    severity: 'warning',
    description: 'enableBlinkFeatures turns on extra Blink features.',
    helpUri: `${SECURITY_DOCS}#10-do-not-use-enableblinkfeatures`,
    appliesTo: 'script',
    pattern: new RegExp(key('enableBlinkFeatures') + `["'\`]`, 'g'),
  },
  {
    id: 'webview-tag',
    severity: 'warning',
    description:
      'The <webview> tag is enabled; verify its options in will-attach-webview.',
    helpUri: `${SECURITY_DOCS}#12-verify-webview-options-before-creation`,
    appliesTo: 'script',
    pattern: new RegExp(key('webviewTag') + TRUE, 'g'),
  },
  {
    id: 'remote-module',
    severity: 'warning',
    description:
      'The remote module is used; it exposes main-process objects to renderers.',
    helpUri: 'https://github.com/electron/remote#readme',
    appliesTo: 'script',
    pattern:
      /(?:["'`]@electron\/remote(?:\/main)?["'`])|(?<![\w$])["']?enableRemoteModule["']?\s*:\s*(?:true|!0)(?![\w$])/g,
  },
  {
    id: 'insecure-url',
    severity: 'warning',
    description: 'Content is loaded over plain HTTP.',
    helpUri: `${SECURITY_DOCS}#1-only-load-secure-content`,
    appliesTo: 'script',
    pattern:
      /\.loadURL\(\s*["'`]http:\/\/(?!localhost[:/"'`]|127\.0\.0\.1[:/"'`]|\[::1\])/g,
  },
  {
    id: 'insecure-command-line-switch',
    severity: 'error',
    description:
      'A command-line switch turns off web security or certificate checks.',
    helpUri: `${SECURITY_DOCS}#6-do-not-disable-websecurity`,
    appliesTo: 'script',
    pattern:
      /appendSwitch\(\s*["'`](?:disable-web-security|ignore-certificate-errors|allow-running-insecure-content)["'`]/g,
  },
  {
    id: 'unsafe-eval-csp',
    severity: 'warning',
    description: "The Content Security Policy allows 'unsafe-eval'.",
    helpUri: `${SECURITY_DOCS}#7-define-a-content-security-policy`,
    appliesTo: 'html',
    pattern: /<meta[^>]+Content-Security-Policy[^>]+'unsafe-eval'[^>]*>/gi,
  },
];

/**
 * A page with no CSP meta tag is only flagged when no script sets a
 * Content-Security-Policy header either (e.g. via session.webRequest).
 */
export const MISSING_CSP_RULE = {
  id: 'missing-csp',
  severity: 'warning' as Severity,
  description: 'This page has no Content Security Policy.',
  helpUri: `${SECURITY_DOCS}#7-define-a-content-security-policy`,
};

export const CSP_META_PATTERN =
  /<meta[^>]+http-equiv\s*=\s*["']?Content-Security-Policy/i;

export interface FuseRule {
  id: string;
  severity: Severity;
  description: string;
  helpUri: string;
  fuse: FuseV1Options;
  /** The fuse state that triggers the finding. */
  flaggedState: FuseState.ENABLE | FuseState.DISABLE;
  /** Only meaningful when the app is packaged into an ASAR archive. */
  requiresAsar?: boolean;
}

export const FUSE_RULES: FuseRule[] = [
  {
    id: 'fuse-run-as-node',
    severity: 'warning',
    description:
      'The RunAsNode fuse is enabled, so ELECTRON_RUN_AS_NODE turns the app into a plain Node.js runtime.',
    helpUri: `${FUSES_DOCS}#runasnode`,
    fuse: FuseV1Options.RunAsNode,
    flaggedState: FuseState.ENABLE,
  },
  {
    id: 'fuse-node-options',
    severity: 'warning',
    description:
      'The EnableNodeOptionsEnvironmentVariable fuse is enabled, so NODE_OPTIONS is honored.',
    helpUri: `${FUSES_DOCS}#nodeoptions`,
    fuse: FuseV1Options.EnableNodeOptionsEnvironmentVariable,
    flaggedState: FuseState.ENABLE,
  },
  {
    id: 'fuse-node-cli-inspect',
    severity: 'warning',
    description:
      'The EnableNodeCliInspectArguments fuse is enabled, so --inspect flags attach a debugger.',
    helpUri: `${FUSES_DOCS}#nodecliinspect`,
    fuse: FuseV1Options.EnableNodeCliInspectArguments,
    flaggedState: FuseState.ENABLE,
  },
  {
    id: 'fuse-asar-integrity',
    severity: 'warning',
    description:
      'The EnableEmbeddedAsarIntegrityValidation fuse is disabled, so a modified app.asar still loads.',
    helpUri: `${FUSES_DOCS}#embeddedasarintegrityvalidation`,
    fuse: FuseV1Options.EnableEmbeddedAsarIntegrityValidation,
    flaggedState: FuseState.DISABLE,
    requiresAsar: true,
  },
  {
    id: 'fuse-only-load-app-from-asar',
    severity: 'warning',
    description:
      'The OnlyLoadAppFromAsar fuse is disabled, so code placed next to app.asar can be loaded instead.',
    helpUri: `${FUSES_DOCS}#onlyloadappfromasar`,
    fuse: FuseV1Options.OnlyLoadAppFromAsar,
    flaggedState: FuseState.DISABLE,
    requiresAsar: true,
  },
  {
    id: 'fuse-file-protocol-privileges',
    severity: 'warning',
    description:
      'The GrantFileProtocolExtraPrivileges fuse is enabled, giving file:// pages extra privileges.',
    helpUri: `${FUSES_DOCS}#grantfileprotocolextraprivileges`,
    fuse: FuseV1Options.GrantFileProtocolExtraPrivileges,
    flaggedState: FuseState.ENABLE,
  },
];

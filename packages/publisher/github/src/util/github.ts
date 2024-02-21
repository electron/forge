import path from 'path';

import { OctokitOptions } from '@octokit/core/dist-types/types.d';
import { retry } from '@octokit/plugin-retry';
import { Octokit } from '@octokit/rest';
import debug from 'debug';

const logInfo = debug('electron-forge:publisher:github:info');
const logDebug = debug('electron-forge:publisher:github:debug');

export default class GitHub {
  private options: OctokitOptions;

  token?: string;

  constructor(authToken: string | undefined = undefined, requireAuth = false, options: OctokitOptions = {}) {
    const noOp = () => {
      /* Intentionally does nothing */
    };

    this.options = {
      ...options,
      log: {
        debug: logDebug.enabled ? logDebug : noOp,
        error: console.error,
        info: logInfo.enabled ? logInfo : noOp,
        warn: console.warn,
      },
      userAgent: 'Electron Forge',
    };

    if (authToken) {
      this.token = authToken;
    } else if (process.env.GITHUB_TOKEN) {
      this.token = process.env.GITHUB_TOKEN;
    } else if (requireAuth) {
      throw new Error('Please set GITHUB_TOKEN in your environment to access these features');
    }
  }

  getGitHub(): Octokit {
    const options: OctokitOptions = { ...this.options };
    if (this.token) {
      options.auth = this.token;
    }
    const RetryableOctokit = Octokit.plugin(retry);
    const github = new RetryableOctokit(options);
    return github;
  }

  // Based on https://github.com/cli/cli/blob/b07f955c23fb54c400b169d39255569e240b324e/pkg/cmd/release/upload/upload.go#L131-L153
  static sanitizeName(name: string): string {
    return (
      path
        .basename(name)
        // Remove diacritics (e.g. é -> e)
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        // Replace special characters with dot
        .replace(/[^\w_.@+-]+/g, '.')
        // Replace multiple dots with a single dot
        .replace(/\.+/g, '.')
        // Remove leading dot if present
        .replace(/^\./g, '')
        // Remove trailing dot if present
        .replace(/\.$/g, '')
    );
  }
}

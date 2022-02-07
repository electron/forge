import debug from 'debug';
import { Octokit } from '@octokit/rest';
import { retry } from '@octokit/plugin-retry';
import { OctokitOptions } from '@octokit/core/dist-types/types.d';

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
        error: console.error, // eslint-disable-line no-console
        info: logInfo.enabled ? logInfo : noOp,
        warn: console.warn, // eslint-disable-line no-console
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
}

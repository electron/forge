import { Octokit } from '@octokit/rest';
import { OctokitOptions } from '@octokit/core/dist-types/types.d';
import { merge } from 'lodash';

export { OctokitOptions } from '@octokit/core/dist-types/types.d';

export default class GitHub {
  private options: OctokitOptions;

  token?: string;

  constructor(
    authToken: string | undefined = undefined,
    requireAuth: boolean = false,
    options: OctokitOptions = {},
  ) {
    this.options = merge(
      options,
      { headers: { 'user-agent': 'Electron Forge' } },
    );
    if (authToken) {
      this.token = authToken;
    } else if (process.env.GITHUB_TOKEN) {
      this.token = process.env.GITHUB_TOKEN;
    } else if (requireAuth) {
      throw new Error('Please set GITHUB_TOKEN in your environment to access these features');
    }
  }

  getGitHub() {
    const github = new Octokit(this.options);
    if (this.token) {
      github.authenticate({
        type: 'token',
        token: this.token,
      });
    }
    return github;
  }
}

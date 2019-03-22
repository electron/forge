import GitHubAPI from '@octokit/rest';
import merge from 'lodash.merge';

export default class GitHub {
  private options: GitHubAPI.Options;

  token?: string;

  constructor(
    authToken: string | undefined = undefined,
    requireAuth: boolean = false,
    options: GitHubAPI.Options = {},
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
    const github = new GitHubAPI(this.options);
    if (this.token) {
      github.authenticate({
        type: 'token',
        token: this.token,
      });
    }
    return github;
  }
}

import GitHubAPI from '@octokit/rest';
import merge from 'lodash.merge';

export default class GitHub {
  constructor(authToken, requireAuth, options = {}) {
    this.options = merge(
      { protocol: 'https' },
      options,
      { headers: { 'user-agent': 'Electron Forge' } }
    );
    if (authToken) {
      this.token = authToken;
    } else if (process.env.GITHUB_TOKEN) {
      this.token = process.env.GITHUB_TOKEN;
    } else if (requireAuth) {
      throw 'Please set GITHUB_TOKEN in your environment to access these features';
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

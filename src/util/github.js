import GitHubAPI from 'github';

export default class GitHub {
  constructor(authToken, requireAuth) {
    if (authToken) {
      this.token = authToken;
    } else if (process.env.GITHUB_TOKEN) {
      this.token = process.env.GITHUB_TOKEN;
    } else if (requireAuth) {
      throw 'Please set GITHUB_TOKEN in your environment to access these features';
    }
  }

  getGitHub() {
    const github = new GitHubAPI({
      protocol: 'https',
      headers: {
        'user-agent': 'Electron Forge',
      },
    });
    if (this.token) {
      github.authenticate({
        type: 'token',
        token: this.token,
      });
    }
    return github;
  }
}

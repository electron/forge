import GitHubAPI from 'github';

export default class GitHub {
  constructor(authToken) {
    if (authToken) {
      this.token = authToken;
    } else if (process.env.GITHUB_TOKEN) {
      this.token = process.env.GITHUB_TOKEN;
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

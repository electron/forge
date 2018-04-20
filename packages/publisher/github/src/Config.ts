import { Options } from '@octokit/rest';

export interface PublisherGithubConfig {
  repository: {
    name: string;
    owner: string;
    draft?: boolean;
  }
  authToken?: string;
  octokitOptions?: Options;
  prerelease?: boolean;
}
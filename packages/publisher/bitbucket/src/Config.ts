
export interface BitbucketRepository {
  /**
   * The name of your repository
   */
  name: string;
  /**
   * The owner of your repository, this is either your username or the name of
   * the organization that owns the repository.
   */
  owner: string;
}

export interface BitbucketAuth {
  /**
   * The username to use when uploading.
   *
   * You can set the BITBUCKET_USERNAME environment variable if you don't want to hard
   * code this into your config.
   */
  username?: string;
  /**
   * An authorization token with permission to upload downloads to this
   * repository.
   *
   * You can set the BITBUCKET_APP_PASSWORD environment variable if you don't want to hard
   * code this into your config.
   */
  appPassword?: string;
}

export interface PublisherBitbucketConfig {
  /**
   * Details that identify your repository (name and owner)
   */
  repository: BitbucketRepository;
  /**
   * User details for uploading releases
   */
  auth: BitbucketAuth;
}

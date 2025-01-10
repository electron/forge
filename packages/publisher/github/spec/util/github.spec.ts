/* eslint-disable node/no-unsupported-features/es-syntax */
import { OctokitOptions } from '@octokit/core/dist-types/types.d';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import GitHub from '../../src/util/github';

const gitHubSpy = vi.fn();

vi.mock('@octokit/rest', async (importOriginal) => {
  const mod = await importOriginal<object>();
  return {
    ...mod,
    Octokit: class {
      private options: OctokitOptions;

      constructor(options: OctokitOptions) {
        gitHubSpy(options);
        this.options = options;
      }

      // eslint-disable-next-line @typescript-eslint/ban-types
      static plugin(): object {
        return this;
      }
    },
  };
});

describe('GitHub', () => {
  it('should read token from constructor', () => {
    expect(new GitHub('token1').token).toEqual('token1');
  });

  it('should fall back to token from environment', () => {
    process.env.GITHUB_TOKEN = 'abc123';
    expect(new GitHub().token).toEqual('abc123');
    delete process.env.GITHUB_TOKEN;
  });

  describe('getGitHub', () => {
    beforeEach(() => {
      gitHubSpy.mockClear();
    });

    it('should create a new GitHubAPI', () => {
      const gh = new GitHub();
      expect(gitHubSpy).not.toHaveBeenCalled();
      gh.getGitHub();
      expect(gitHubSpy).toHaveBeenCalledOnce();
    });

    it('should be able to set the Enterprise URL settings', () => {
      const gh = new GitHub('1234', true, {
        baseUrl: 'https://github.example.com:8443/enterprise',
      });
      gh.getGitHub();
      expect(gitHubSpy).toHaveBeenCalledWith({
        auth: '1234',
        baseUrl: 'https://github.example.com:8443/enterprise',
        userAgent: 'Electron Forge',
        log: expect.anything(),
      });
    });

    it('should not override the user agent', () => {
      const gh = new GitHub('1234', true, { userAgent: 'Something' });
      gh.getGitHub();
      expect(gitHubSpy).toHaveBeenCalledWith(expect.objectContaining({ userAgent: 'Electron Forge' }));
    });

    it('should authenticate if a token is present', () => {
      const gh = new GitHub('token');
      gh.getGitHub();
      expect(gitHubSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: 'token',
          userAgent: 'Electron Forge',
        })
      );
    });

    it('should not authenticate if a token is not present', () => {
      const gh = new GitHub();
      gh.getGitHub();
      expect(gitHubSpy).toHaveBeenCalledWith({
        userAgent: 'Electron Forge',
        log: expect.anything(),
      });
    });
    it('should throw an exception if a token is required', async () => {
      expect(() => {
        const gh = new GitHub(undefined, true);
        gh.getGitHub();
      }).toThrow('Please set GITHUB_TOKEN in your environment to access these features');
    });
  });

  describe('sanitizeName', () => {
    it('should remove leading and trailing periods from the basename', () => {
      expect(GitHub.sanitizeName('path/to/.foo.')).toEqual('foo');
    });

    it('should remove multiple periods in a row', () => {
      expect(GitHub.sanitizeName('path/to/foo..bar')).toEqual('foo.bar');
    });

    it('should replace non-alphanumeric, non-hyphen characters with periods', () => {
      expect(GitHub.sanitizeName('path/to/foo%$bar   baz.')).toEqual('foo.bar.baz');
    });

    it('should preserve special symbols', () => {
      expect(GitHub.sanitizeName('path/to/@foo+bar_')).toEqual('@foo+bar_');
    });

    it('should preserve hyphens', () => {
      const name = 'electron-fiddle-0.99.0-full.nupkg';
      expect(GitHub.sanitizeName(`path/to/${name}`)).toEqual(name);
    });

    it('should remove diacritics', () => {
      expect(GitHub.sanitizeName('électron')).toEqual('electron');
    });
  });
});

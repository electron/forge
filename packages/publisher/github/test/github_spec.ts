import { OctokitOptions } from '@octokit/core/dist-types/types.d';
import { Octokit } from '@octokit/rest';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { SinonSpy, spy } from 'sinon';

import InternalGitHub from '../src/util/github';

describe('GitHub', () => {
  let GitHub: typeof InternalGitHub;
  let gitHubSpy: SinonSpy;
  let MockGitHub;

  beforeEach(() => {
    gitHubSpy = spy();
    MockGitHub = class {
      private options: OctokitOptions;

      constructor(options: OctokitOptions) {
        gitHubSpy();
        this.options = options;
      }

      static plugin(): object {
        return this;
      }
    };
    GitHub = proxyquire.noCallThru().load('../src/util/github', {
      '@octokit/rest': {
        Octokit: MockGitHub,
      },
    }).default;
  });

  it('should read token from constructor', () => {
    expect(new GitHub('token1').token).to.equal('token1');
  });

  it('should fall back to token from environment', () => {
    process.env.GITHUB_TOKEN = 'abc123';
    expect(new GitHub().token).to.equal('abc123');
    delete process.env.GITHUB_TOKEN;
  });

  describe('getGitHub', () => {
    function getOptions(api: Octokit): OctokitOptions {
      // TODO: figure out if there's a legit way to extract options
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { options } = api as any;
      delete options.log;
      return options;
    }

    it('should create a new GitHubAPI', () => {
      const gh = new GitHub();
      expect(gitHubSpy.callCount).to.equal(0);
      gh.getGitHub();
      expect(gitHubSpy.callCount).to.equal(1);
    });

    it('should be able to set the Enterprise URL settings', () => {
      const gh = new GitHub('1234', true, {
        baseUrl: 'https://github.example.com:8443/enterprise',
      });
      const api = gh.getGitHub();

      expect(getOptions(api)).to.deep.equal({
        auth: '1234',
        baseUrl: 'https://github.example.com:8443/enterprise',
        userAgent: 'Electron Forge',
      });
    });

    it('should not override the user agent', () => {
      const gh = new GitHub('1234', true, { userAgent: 'Something' });
      const api = gh.getGitHub();

      expect(getOptions(api).userAgent).to.equal('Electron Forge');
    });

    it('should authenticate if a token is present', () => {
      const gh = new GitHub('token');
      const api = gh.getGitHub();
      gh.getGitHub();
      expect(getOptions(api)).to.deep.equal({
        auth: 'token',
        userAgent: 'Electron Forge',
      });
    });

    it('should not authenticate if a token is not present', () => {
      const gh = new GitHub();
      const api = gh.getGitHub();
      gh.getGitHub();
      expect(getOptions(api)).to.deep.equal({
        userAgent: 'Electron Forge',
      });
    });

    it('should throw an exception if a token is required', () => {
      expect(() => {
        const gh = new GitHub(undefined, true);
        gh.getGitHub();
      }).to.throw('Please set GITHUB_TOKEN in your environment to access these features');
    });
  });

  describe('sanitizeName', () => {
    it('should remove leading and trailing periods from the basename', () => {
      expect(GitHub.sanitizeName('path/to/.foo.')).to.equal('foo');
    });

    it('should remove multiple periods in a row', () => {
      expect(GitHub.sanitizeName('path/to/foo..bar')).to.equal('foo.bar');
    });

    it('should replace non-alphanumeric, non-hyphen characters with periods', () => {
      expect(GitHub.sanitizeName('path/to/foo%$bar   baz.')).to.equal('foo.bar.baz');
    });

    it('should preserve special symbols', () => {
      expect(GitHub.sanitizeName('path/to/@foo+bar_')).to.equal('@foo+bar_');
    });

    it('should preserve hyphens', () => {
      const name = 'electron-fiddle-0.99.0-full.nupkg';
      expect(GitHub.sanitizeName(`path/to/${name}`)).to.equal(name);
    });

    it('should remove diacritics', () => {
      expect(GitHub.sanitizeName('électron')).to.equal('electron');
    });
  });
});

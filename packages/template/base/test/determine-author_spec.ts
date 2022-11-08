import { PackagePerson } from '@electron-forge/shared-types';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

describe('determineAuthor', () => {
  let determineAuthor: (dir: string) => Promise<PackagePerson>;
  let returnGitUsername = true;
  let returnGitEmail = true;
  const fakeSpawn = async (cmd: string, args: string[], _options: { cwd: string }): Promise<string> => {
    if (args.includes('user.name')) {
      if (returnGitUsername) {
        return Promise.resolve('Foo Bar\n');
      }

      throw new Error('Not returning username');
    } else if (args.includes('user.email')) {
      if (returnGitEmail) {
        return Promise.resolve('foo@example.com\n');
      }

      throw new Error('Not returning email');
    }

    throw new Error(`Unknown command: ${cmd} ${args.join(' ')}`);
  };

  beforeEach(() => {
    determineAuthor = proxyquire.noCallThru().load('../src/determine-author', {
      '@malept/cross-spawn-promise': { spawn: stub().callsFake(fakeSpawn) },
      username: stub().resolves('fromUsername'),
    }).default;
  });

  it('returns git config if both name and email are set', async () => {
    returnGitUsername = true;
    returnGitEmail = true;
    expect(await determineAuthor('foo')).to.deep.equal({ name: 'Foo Bar', email: 'foo@example.com' });
  });

  it('returns username if only name is set', async () => {
    returnGitUsername = true;
    returnGitEmail = false;
    expect(await determineAuthor('foo')).to.equal('fromUsername');
  });

  it('returns username if only name is set', async () => {
    returnGitUsername = false;
    returnGitEmail = true;
    expect(await determineAuthor('foo')).to.equal('fromUsername');
  });
});

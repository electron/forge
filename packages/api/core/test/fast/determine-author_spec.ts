import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { PackagePerson } from '@electron-forge/shared-types';

describe('determineAuthor', () => {
  let determineAuthor: (dir: string) => Promise<PackagePerson>;
  let returnGitUsername = true;
  let returnGitEmail = true;
  // eslint-disable-next-line max-len
  const fakeExec = (cmd: string, options: { cwd: string }, callback: (err: Error | null, result?: { stdout?: string, stderr?: string }) => void) => {
    if (cmd.includes('user.name')) {
      if (returnGitUsername) {
        callback(null, { stdout: 'Foo Bar\n' });
      } else {
        callback(new Error('Not returning username'));
      }
    } else if (cmd.includes('user.email')) {
      if (returnGitEmail) {
        callback(null, { stdout: 'foo@example.com\n' });
      } else {
        callback(new Error('Not returning email'));
      }
    } else {
      callback(new Error('Unknown cmd'));
    }
  };

  beforeEach(() => {
    determineAuthor = proxyquire.noCallThru().load('../../src/util/determine-author', {
      child_process: { exec: sinon.stub().callsFake(fakeExec) },
      username: sinon.stub().resolves('fromUsername'),
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

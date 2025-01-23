import { describe, expect, it, vi } from 'vitest';

import determineAuthor from '../src/determine-author';

let returnGitUsername = true;
let returnGitEmail = true;

vi.mock(import('@malept/cross-spawn-promise'), () => {
  return {
    spawn: vi.fn().mockImplementation(async (cmd: string, args: string[], _options: { cwd: string }): Promise<string> => {
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
    }),
  };
});

vi.mock('username', async (importOriginal) => {
  const mod = await importOriginal<object>();
  return {
    ...mod,
    default: vi.fn().mockResolvedValue('fromUsername'),
  };
});

describe('determineAuthor', () => {
  it('returns git config if both name and email are set', async () => {
    returnGitUsername = true;
    returnGitEmail = true;
    await expect(determineAuthor('foo')).resolves.toEqual({ name: 'Foo Bar', email: 'foo@example.com' });
  });

  it('returns username if only name is set', async () => {
    returnGitUsername = true;
    returnGitEmail = false;
    await expect(determineAuthor('foo')).resolves.toEqual('fromUsername');
  });

  it('returns username if only name is set', async () => {
    returnGitUsername = false;
    returnGitEmail = true;
    await expect(determineAuthor('foo')).resolves.toEqual('fromUsername');
  });
});

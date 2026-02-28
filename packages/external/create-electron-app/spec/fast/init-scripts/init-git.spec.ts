import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import { initGit } from '../../../src/init-scripts/init-git';

let dir: string;
let dirID = Date.now();

const ensureTestDirIsNonexistent = async () => {
  dir = path.resolve(os.tmpdir(), `electron-forge-git-test-${dirID}`);
  dirID += 1;
  await fs.promises.rm(dir, { recursive: true, force: true });
};

describe('init-git', () => {
  beforeEach(async () => {
    await ensureTestDirIsNonexistent();
    await fs.promises.mkdir(dir, { recursive: true });
  });

  it('creates Git repository when run inside non-Git directory', async () => {
    await initGit(dir);
    const gitDir = path.join(dir, '.git');
    expect(
      fs.existsSync(gitDir),
      'the .git directory inside the folder',
    ).toEqual(true);
  });

  it('skips when run at root of Git repository', async () => {
    execSync('git init', { cwd: dir });

    const gitDir = path.join(dir, '.git');
    const config = path.join(gitDir, 'config');
    const statBefore = await fs.promises.lstat(config);
    const before = statBefore.mtimeMs;

    await initGit(dir);

    const statAfter = await fs.promises.lstat(config);
    const after = statAfter.mtimeMs;

    expect(after, 'the config file in the repository').toEqual(before);
  });

  it('skips when run in subdirectory of Git repository', async () => {
    execSync('git init', { cwd: dir });

    const gitDir = path.join(dir, '.git');
    const config = path.join(gitDir, 'config');
    const statBefore = await fs.promises.lstat(config);
    const before = statBefore.mtimeMs;

    const subdir = path.join(dir, 'some', 'other', 'folder');
    const innerGitDir = path.join(subdir, '.git');

    await fs.promises.mkdir(subdir, { recursive: true });

    await initGit(subdir);

    const statAfter = await fs.promises.lstat(config);
    const after = statAfter.mtimeMs;

    expect(after, 'the config file in the repository').toEqual(before);
    expect(
      fs.existsSync(innerGitDir),
      'a nested .git directory inside the repository',
    ).toEqual(false);
  });
});

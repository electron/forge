import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { findUp } from '../src/find-up';

describe('findUp', () => {
  let tmpRoot: string;
  let nestedDir: string;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'forge-find-up-'));
    nestedDir = path.join(tmpRoot, 'a', 'b', 'c');
    await fs.mkdir(nestedDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it('finds a file in the starting directory', async () => {
    const target = path.join(nestedDir, 'yarn.lock');
    await fs.writeFile(target, '');

    await expect(findUp(['yarn.lock'], { cwd: nestedDir })).resolves.toBe(
      target,
    );
  });

  it('finds a file in an ancestor directory', async () => {
    const target = path.join(tmpRoot, 'package-lock.json');
    await fs.writeFile(target, '');

    await expect(
      findUp(['package-lock.json'], { cwd: nestedDir }),
    ).resolves.toBe(target);
  });

  it('returns the closest match when multiple ancestors contain a candidate', async () => {
    await fs.writeFile(path.join(tmpRoot, 'yarn.lock'), '');
    const closer = path.join(tmpRoot, 'a', 'yarn.lock');
    await fs.writeFile(closer, '');

    await expect(findUp(['yarn.lock'], { cwd: nestedDir })).resolves.toBe(
      closer,
    );
  });

  it('respects the order of the names array within a single directory', async () => {
    const first = path.join(tmpRoot, 'package-lock.json');
    const second = path.join(tmpRoot, 'yarn.lock');
    await fs.writeFile(first, '');
    await fs.writeFile(second, '');

    await expect(
      findUp(['package-lock.json', 'yarn.lock'], { cwd: nestedDir }),
    ).resolves.toBe(first);
    await expect(
      findUp(['yarn.lock', 'package-lock.json'], { cwd: nestedDir }),
    ).resolves.toBe(second);
  });

  it('ignores directories that share a candidate name', async () => {
    await fs.mkdir(path.join(tmpRoot, 'a', 'yarn.lock'));
    const target = path.join(tmpRoot, 'yarn.lock');
    await fs.writeFile(target, '');

    await expect(findUp(['yarn.lock'], { cwd: nestedDir })).resolves.toBe(
      target,
    );
  });

  it('returns undefined when no candidate exists up to the filesystem root', async () => {
    await expect(
      findUp(['definitely-not-a-real-forge-file.lock'], { cwd: nestedDir }),
    ).resolves.toBeUndefined();
  });
});

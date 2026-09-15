import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveWorkingDir } from '../../src/util/resolve-working-dir';

describe('resolveWorkingDir', () => {
  it('resolves relative paths according to the current working directory', () => {
    const dir = resolveWorkingDir('.');

    expect(dir).toEqual(process.cwd());
  });

  it('works with an absolute directory', () => {
    const upOne = path.resolve(process.cwd(), '..');
    expect(path.isAbsolute(upOne)).toBe(true);
    const dir = resolveWorkingDir(upOne);

    expect(dir).toEqual(upOne);
  });

  it('resolves a relative path if checkExisting=false and dir does not exist', () => {
    const dir = resolveWorkingDir('./i-made-this-dir-up', false);

    expect(dir).toEqual(path.resolve(process.cwd(), './i-made-this-dir-up'));
  });

  it('resolves an absolute path if checkExisting=false and dir does not exist', () => {
    const fakeDir = path.resolve(process.cwd(), './i-made-this-dir-up');
    expect(path.isAbsolute(fakeDir)).toBe(true);
    const dir = resolveWorkingDir(fakeDir, false);

    expect(dir).toEqual(fakeDir);
  });

  it('falls back to the current working directory with a relative path if checkExisting=true and dir does not exist', () => {
    const dir = resolveWorkingDir('./i-made-this-dir-up', true);

    expect(dir).toEqual(process.cwd());
  });

  it('falls back to the current working directory with an absolute path if checkExisting=true and dir does not exist', () => {
    const fakeDir = path.resolve(process.cwd(), './i-made-this-dir-up');
    expect(path.isAbsolute(fakeDir)).toBe(true);
    const dir = resolveWorkingDir(fakeDir);

    expect(dir).toEqual(process.cwd());
  });
});

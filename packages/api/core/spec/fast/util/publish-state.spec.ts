import path from 'node:path';

import { ForgeMakeResult } from '@electron-forge/shared-types';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PublishState from '../../../src/util/publish-state';

vi.mock(import('fs-extra'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: {
      ...mod.default,
      readJson: vi.fn(),
      writeJson: vi.fn(),
      mkdirs: vi.fn(),
      outputJson: vi.fn(),
    },
  };
});

describe('PublishState', () => {
  const SAMPLE_PATH = path.resolve(
    '/tmp/forge-test/out/publish-dry-run/abc/null',
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('load', () => {
    it('reads the file and assigns state on the happy path', async () => {
      const expected = { artifacts: ['a.dmg'] } as unknown as ForgeMakeResult;
      vi.mocked(fs.readJson).mockResolvedValueOnce(expected);

      const state = new PublishState(SAMPLE_PATH);
      await state.load();

      expect(fs.readJson).toHaveBeenCalledWith(SAMPLE_PATH);
      expect(state.state).toBe(expected);
    });

    it('surfaces ENOENT as a clear "state file not found" error with cause preserved', async () => {
      const enoent = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      vi.mocked(fs.readJson).mockRejectedValueOnce(enoent);

      const state = new PublishState(SAMPLE_PATH);
      await expect(state.load()).rejects.toThrow(
        /Publish state file not found.*dry-run output directory may have been deleted/,
      );

      vi.mocked(fs.readJson).mockRejectedValueOnce(enoent);
      const state2 = new PublishState(SAMPLE_PATH);
      try {
        await state2.load();
      } catch (e) {
        expect(
          (e as Error & { cause?: NodeJS.ErrnoException }).cause?.code,
        ).toBe('ENOENT');
      }
    });

    it('surfaces a corrupt-JSON SyntaxError with a re-run suggestion', async () => {
      const syntax = new SyntaxError('Unexpected end of JSON input');
      vi.mocked(fs.readJson).mockRejectedValueOnce(syntax);

      const state = new PublishState(SAMPLE_PATH);
      await expect(state.load()).rejects.toThrow(
        /Publish state file is corrupt.*Re-run.*electron-forge make/,
      );
    });

    it('rethrows unexpected errors unchanged', async () => {
      const unexpected = Object.assign(new Error('EIO'), { code: 'EIO' });
      vi.mocked(fs.readJson).mockRejectedValueOnce(unexpected);

      const state = new PublishState(SAMPLE_PATH);
      await expect(state.load()).rejects.toBe(unexpected);
    });
  });

  describe('saveToDisk', () => {
    it('writes via outputJson on the happy path (replaces mkdirs + writeJson)', async () => {
      vi.mocked(fs.outputJson).mockResolvedValueOnce(undefined);

      const state = new PublishState(SAMPLE_PATH);
      state.state = { artifacts: ['a.dmg'] } as unknown as ForgeMakeResult;

      await expect(state.saveToDisk()).resolves.toBeUndefined();

      expect(fs.outputJson).toHaveBeenCalledWith(SAMPLE_PATH, state.state);
      // No standalone mkdirs call any more — outputJson handles both.
      expect(fs.mkdirs).not.toHaveBeenCalled();
      expect(fs.writeJson).not.toHaveBeenCalled();
    });

    it('surfaces EACCES as a permission error with the path and cause preserved', async () => {
      const eacces = Object.assign(new Error('EACCES'), { code: 'EACCES' });
      vi.mocked(fs.outputJson).mockRejectedValueOnce(eacces);

      const state = new PublishState(SAMPLE_PATH);
      state.state = { artifacts: [] } as unknown as ForgeMakeResult;

      await expect(state.saveToDisk()).rejects.toThrow(
        /Cannot write publish state.*permission denied.*dry-run output directory is writable/,
      );

      vi.mocked(fs.outputJson).mockRejectedValueOnce(eacces);
      const state2 = new PublishState(SAMPLE_PATH);
      state2.state = { artifacts: [] } as unknown as ForgeMakeResult;
      try {
        await state2.saveToDisk();
      } catch (e) {
        expect(
          (e as Error & { cause?: NodeJS.ErrnoException }).cause?.code,
        ).toBe('EACCES');
      }
    });

    it('surfaces EROFS (read-only filesystem) the same way', async () => {
      const erofs = Object.assign(new Error('EROFS'), { code: 'EROFS' });
      vi.mocked(fs.outputJson).mockRejectedValueOnce(erofs);

      const state = new PublishState(SAMPLE_PATH);
      state.state = { artifacts: [] } as unknown as ForgeMakeResult;

      await expect(state.saveToDisk()).rejects.toThrow(/permission denied/);
    });

    it('rethrows ENOSPC (disk full) unchanged so observability is preserved', async () => {
      const enospc = Object.assign(new Error('ENOSPC'), { code: 'ENOSPC' });
      vi.mocked(fs.outputJson).mockRejectedValueOnce(enospc);

      const state = new PublishState(SAMPLE_PATH);
      state.state = { artifacts: [] } as unknown as ForgeMakeResult;

      await expect(state.saveToDisk()).rejects.toBe(enospc);
    });
  });
});

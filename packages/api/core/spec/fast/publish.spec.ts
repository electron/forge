import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { ForgeMakeResult, ResolvedForgeConfig } from '@electron-forge/shared-types';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { listrMake } from '../../src/api/make';
import publish from '../../src/api/publish';
import findConfig from '../../src/util/forge-config';
import importSearch from '../../src/util/import-search';

vi.mock(import('../../src/api/make'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    listrMake: vi.fn().mockReturnValue({ run: vi.fn() }),
  };
});

vi.mock(import('../../src/util/forge-config'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: vi.fn().mockReturnValue({}),
  };
});

vi.mock(import('../../src/util/resolve-dir'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: vi.fn().mockReturnValue('fake-target-dir'),
  };
});

vi.mock(import('../../src/util/import-search'), async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    default: vi.fn(),
  };
});

describe('publish', () => {
  it('calls "make"', async () => {
    await publish({
      dir: __dirname,
      interactive: false,
    });
    expect(vi.mocked(listrMake)).toHaveBeenCalledOnce();
  });

  it('uses publishers from the forge config if provided', async () => {
    const MockPublisher = vi.fn();
    const mockPublish = vi.fn();
    MockPublisher.prototype.publish = mockPublish;
    MockPublisher.prototype.__isElectronForgePublisher = true;

    const config = {
      publishers: [new MockPublisher()],
    };

    vi.mocked(findConfig).mockResolvedValue(config as unknown as ResolvedForgeConfig);
    vi.mocked(listrMake).mockImplementationOnce((_childTrace, _opts, cb) => {
      cb!([
        {
          artifacts: ['artifact-1'],
        },
      ] as ForgeMakeResult[]);

      return {
        run: vi.fn(),
      } as any;
    });

    await publish({
      dir: __dirname,
      interactive: false,
    });

    expect(mockPublish).toHaveBeenCalledOnce();
    expect(mockPublish.mock.calls[0]).toEqual([
      {
        dir: 'fake-target-dir',
        forgeConfig: config,
        setStatusLine: expect.anything(),
        makeResults: [
          {
            artifacts: ['artifact-1'],
          },
        ],
      },
    ]);
  });

  it('can override publish targets', async () => {
    const MockPublisher = vi.fn();
    const mockPublish = vi.fn();
    MockPublisher.prototype.publish = mockPublish;
    MockPublisher.prototype.__isElectronForgePublisher = true;

    vi.mocked(findConfig).mockResolvedValue({} as unknown as ResolvedForgeConfig);

    await publish({
      dir: __dirname,
      interactive: false,
      publishTargets: [new MockPublisher()],
    });

    expect(mockPublish).toHaveBeenCalledOnce();
  });

  it('can resolve publisher names from the config', async () => {
    const MockPublisher = vi.fn();
    const mockPublish = vi.fn();
    MockPublisher.prototype.publish = mockPublish;
    MockPublisher.prototype.__isElectronForgePublisher = true;

    vi.mocked(findConfig).mockResolvedValue({
      publishers: [
        {
          name: '@electron-forge/publisher-foo',
        },
      ],
    } as unknown as ResolvedForgeConfig);

    vi.mocked(importSearch).mockResolvedValue(MockPublisher);

    await publish({
      dir: __dirname,
      interactive: false,
    });

    expect(mockPublish).toHaveBeenCalledOnce();
  });

  describe('dry run', () => {
    let tmpDir: string;

    beforeAll(async () => {
      const tmp = os.tmpdir();
      const tmpdir = path.join(tmp, 'electron-forge-test-');
      tmpDir = await fs.mkdtemp(tmpdir);
      await fs.writeFile(path.join(tmpDir, 'artifact-1'), 'beep');
      await fs.writeFile(path.join(tmpDir, 'artifact-2'), 'boop');
      vi.mocked(listrMake).mockImplementationOnce((_childTrace, _opts, cb) => {
        cb!([
          {
            artifacts: [path.join(tmpDir, 'artifact-1')],
          },
          {
            artifacts: [path.join(tmpDir, 'artifact-2')],
          },
        ] as ForgeMakeResult[]);

        return {
          run: vi.fn(),
        } as any;
      });
    });

    afterAll(async () => {
      await fs.rm(tmpDir, { recursive: true });
    });

    it('dryRun creates hash JSON files', async () => {
      await publish({
        dir: __dirname,
        outDir: tmpDir,
        interactive: false,
        dryRun: true,
      });
      const folder = [tmpDir, 'publish-dry-run'];
      const dryRunFolder = await fs.readdir(path.join(...folder));
      expect(dryRunFolder).toHaveLength(1);
      folder.push(dryRunFolder.pop() as string);
      const hashFolder = await fs.readdir(path.join(...folder));
      expect(hashFolder).toEqual([expect.stringContaining('.forge.publish'), expect.stringContaining('.forge.publish')]);

      for (const file of hashFolder) {
        const hashFile = await fs.readFile(path.join(...folder, file), 'utf8');
        expect(JSON.parse(hashFile)).toEqual({
          artifacts: [expect.stringContaining('artifact-')],
        });
      }
    });

    // Note: you need to run this entire describe() block together for this test to pass
    it('dryRunResume consumes hash files', async () => {
      const MockPublisher = vi.fn();
      const mockPublish = vi.fn();
      MockPublisher.prototype.publish = mockPublish;
      MockPublisher.prototype.__isElectronForgePublisher = true;

      await publish({
        dir: __dirname,
        outDir: tmpDir,
        interactive: false,
        dryRunResume: true,
        publishTargets: [new MockPublisher()],
      });

      expect(mockPublish).toHaveBeenCalledOnce();
    });
  });
});

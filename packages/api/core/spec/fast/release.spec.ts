import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  ForgeMakeResult,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { listrMake } from '../../src/api/make';
import release from '../../src/api/release';
import findConfig from '../../src/util/forge-config.js';
import { importSearch } from '../../src/util/import-search.js';
import { saveMakeResults } from '../../src/util/make-results.js';
import resolveDir from '../../src/util/resolve-dir.js';

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
    importSearch: vi.fn(),
  };
});

describe('release', () => {
  it('calls "make"', async () => {
    await release({
      dir: import.meta.dirname,
      interactive: false,
    });
    expect(vi.mocked(listrMake)).toHaveBeenCalledOnce();
  });

  it('passes the resolved forge config through to "make"', async () => {
    const forgeConfig = { publishers: [] } as unknown as ResolvedForgeConfig;
    vi.mocked(findConfig).mockResolvedValue(forgeConfig);

    await release({
      dir: import.meta.dirname,
      interactive: false,
    });

    expect(vi.mocked(listrMake)).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ forgeConfig }),
      expect.any(Function),
    );
  });

  it('uses publishers from the forge config if provided', async () => {
    const MockPublisher = vi.fn();
    const mockPublish = vi.fn();
    MockPublisher.prototype.publish = mockPublish;
    MockPublisher.prototype.__isElectronForgePublisher = true;

    const config = {
      publishers: [new MockPublisher()],
    };

    vi.mocked(findConfig).mockResolvedValue(
      config as unknown as ResolvedForgeConfig,
    );
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

    await release({
      dir: import.meta.dirname,
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

    vi.mocked(findConfig).mockResolvedValue(
      {} as unknown as ResolvedForgeConfig,
    );

    await release({
      dir: import.meta.dirname,
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

    await release({
      dir: import.meta.dirname,
      interactive: false,
    });

    expect(mockPublish).toHaveBeenCalledOnce();
  });

  describe('fromMake', () => {
    // The project directory: artifact paths in the saved manifests are
    // relative to it, so `release` must resolve the same directory.
    let tmpDir: string;
    // A fresh out directory for every test so saved manifests don't leak
    let outDir: string;
    let makeResults: ForgeMakeResult[];

    beforeAll(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'electron-forge-test-'));
      vi.mocked(resolveDir).mockResolvedValue(tmpDir);
      await fs.writeFile(path.join(tmpDir, 'artifact-1'), 'beep');
      await fs.writeFile(path.join(tmpDir, 'artifact-2'), 'boop');
      makeResults = [
        {
          artifacts: [path.join(tmpDir, 'artifact-1')],
          platform: 'linux',
          arch: 'x64',
        },
        {
          artifacts: [path.join(tmpDir, 'artifact-2')],
          platform: 'linux',
          arch: 'arm64',
        },
      ] as ForgeMakeResult[];
    });

    beforeEach(async () => {
      outDir = await fs.mkdtemp(path.join(tmpDir, 'out-'));
    });

    afterAll(async () => {
      vi.mocked(resolveDir).mockResolvedValue('fake-target-dir');
      await fs.rm(tmpDir, { recursive: true });
    });

    function mockPublisher() {
      const MockPublisher = vi.fn();
      const mockPublish = vi.fn();
      MockPublisher.prototype.publish = mockPublish;
      MockPublisher.prototype.__isElectronForgePublisher = true;
      return { publisher: new MockPublisher(), publish: mockPublish };
    }

    it('releases the results saved by a previous make run without calling make', async () => {
      await saveMakeResults(outDir, makeResults, tmpDir);
      const { publisher, publish } = mockPublisher();

      await release({
        dir: import.meta.dirname,
        outDir,
        interactive: false,
        fromMake: true,
        publishTargets: [publisher],
      });

      expect(vi.mocked(listrMake)).not.toHaveBeenCalled();
      expect(publish).toHaveBeenCalledOnce();
      expect(publish.mock.calls[0][0].makeResults).toEqual(makeResults);
    });

    it('releases each saved make run separately', async () => {
      await saveMakeResults(outDir, [makeResults[0]], tmpDir);
      await saveMakeResults(outDir, [makeResults[1]], tmpDir);
      const { publisher, publish } = mockPublisher();

      await release({
        dir: import.meta.dirname,
        outDir,
        interactive: false,
        fromMake: true,
        publishTargets: [publisher],
      });

      expect(publish).toHaveBeenCalledTimes(2);
      expect(
        publish.mock.calls.map((call) => call[0].makeResults).flat(),
      ).toEqual(expect.arrayContaining(makeResults));
    });

    it('looks for saved results in makeOptions.outDir when it is set', async () => {
      await saveMakeResults(outDir, makeResults, tmpDir);
      const { publisher, publish } = mockPublisher();

      await release({
        dir: import.meta.dirname,
        interactive: false,
        fromMake: true,
        makeOptions: { outDir },
        publishTargets: [publisher],
      });

      expect(publish).toHaveBeenCalledOnce();
      expect(publish.mock.calls[0][0].makeResults).toEqual(makeResults);
    });

    it('fails if a saved artifact is missing', async () => {
      await saveMakeResults(
        outDir,
        [
          {
            artifacts: [path.join(tmpDir, 'artifact-missing')],
            platform: 'linux',
            arch: 'x64',
          },
        ] as ForgeMakeResult[],
        tmpDir,
      );
      const { publisher, publish } = mockPublisher();

      await expect(
        release({
          dir: import.meta.dirname,
          outDir,
          interactive: false,
          fromMake: true,
          publishTargets: [publisher],
        }),
      ).rejects.toThrowError(/artifact-missing.*could not be found/);
      expect(publish).not.toHaveBeenCalled();
    });

    it('fails if nothing has been made yet', async () => {
      const emptyOutDir = path.join(outDir, 'empty');
      const { publisher, publish } = mockPublisher();

      await expect(
        release({
          dir: import.meta.dirname,
          outDir: emptyOutDir,
          interactive: false,
          fromMake: true,
          publishTargets: [publisher],
        }),
      ).rejects.toThrowError(/No saved make results were found/);
      expect(publish).not.toHaveBeenCalled();
    });

    it('accepts the deprecated dryRunResume alias', async () => {
      await saveMakeResults(outDir, makeResults, tmpDir);
      const { publisher, publish } = mockPublisher();

      await release({
        dir: import.meta.dirname,
        outDir,
        interactive: false,
        dryRunResume: true,
        publishTargets: [publisher],
      });

      expect(vi.mocked(listrMake)).not.toHaveBeenCalled();
      expect(publish).toHaveBeenCalledOnce();
    });

    it('rejects fromMake combined with fromPackage', async () => {
      await expect(
        release({
          dir: import.meta.dirname,
          interactive: false,
          fromMake: true,
          makeOptions: { fromPackage: true },
        }),
      ).rejects.toThrowError(
        /fromMake and fromPackage options .* cannot be combined/,
      );
    });

    it('rejects fromMake combined with the deprecated skipPackage alias', async () => {
      await expect(
        release({
          dir: import.meta.dirname,
          interactive: false,
          fromMake: true,
          makeOptions: { skipPackage: true },
        }),
      ).rejects.toThrowError(/cannot be combined/);
    });

    it('rejects dryRun combined with fromMake', async () => {
      await expect(
        release({
          dir: import.meta.dirname,
          interactive: false,
          fromMake: true,
          dryRun: true,
        }),
      ).rejects.toThrowError(
        /Can't release from a previous make run and dry run/,
      );
    });
  });

  it('runs make but does not publish with the deprecated dryRun option', async () => {
    const MockPublisher = vi.fn();
    const mockPublish = vi.fn();
    MockPublisher.prototype.publish = mockPublish;
    MockPublisher.prototype.__isElectronForgePublisher = true;

    await release({
      dir: import.meta.dirname,
      interactive: false,
      dryRun: true,
      publishTargets: [new MockPublisher()],
    });

    expect(vi.mocked(listrMake)).toHaveBeenCalledOnce();
    expect(mockPublish).not.toHaveBeenCalled();
  });
});

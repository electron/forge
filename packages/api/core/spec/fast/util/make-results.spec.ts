import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { ForgeMakeResult } from '@electron-forge/shared-types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  getMakeResultsDir,
  loadMakeResults,
  saveMakeResults,
} from '../../../src/util/make-results';

function makeResult(
  rootDir: string,
  platform: string,
  arch: string,
  ...artifacts: string[]
): ForgeMakeResult {
  return {
    artifacts: artifacts.map((artifact) =>
      path.join(rootDir, 'out', 'make', artifact),
    ),
    packageJSON: { name: 'test', version: '1.0.0' },
    platform,
    arch,
  } as ForgeMakeResult;
}

function makerResult(
  rootDir: string,
  maker: string,
  ...artifacts: string[]
): ForgeMakeResult {
  return { ...makeResult(rootDir, 'linux', 'x64', ...artifacts), maker };
}

async function savedArtifactNames(outDir: string, rootDir: string) {
  return (await loadMakeResults(outDir, rootDir))
    .flat()
    .flatMap((r) => r.artifacts.map((a) => path.basename(a)))
    .sort();
}

describe('make-results', () => {
  let rootDir: string;
  let outDir: string;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'forge-make-results-'));
    outDir = path.join(rootDir, 'out');
  });

  afterEach(async () => {
    await fs.rm(rootDir, { recursive: true, force: true });
  });

  it('saves a manifest with artifact paths relative to the project root', async () => {
    const manifest = await saveMakeResults(
      outDir,
      [makeResult(rootDir, 'linux', 'x64', 'app.deb', 'app.rpm')],
      rootDir,
    );

    expect(path.dirname(manifest)).toEqual(getMakeResultsDir(outDir));
    expect(manifest).toMatch(/\.forge-make\.json$/);
    expect(JSON.parse(await fs.readFile(manifest, 'utf8'))).toEqual([
      {
        artifacts: ['out/make/app.deb', 'out/make/app.rpm'],
        packageJSON: { name: 'test', version: '1.0.0' },
        platform: 'linux',
        arch: 'x64',
      },
    ]);
  });

  it('does not mutate the results it is given', async () => {
    const results = [makeResult(rootDir, 'linux', 'x64', 'app.deb')];
    const artifacts = [...results[0].artifacts];

    await saveMakeResults(outDir, results, rootDir);

    expect(results[0].artifacts).toEqual(artifacts);
  });

  it('round-trips through load with absolute artifact paths', async () => {
    const results = [makeResult(rootDir, 'linux', 'x64', 'app.deb')];
    await saveMakeResults(outDir, results, rootDir);

    await expect(loadMakeResults(outDir, rootDir)).resolves.toEqual([results]);
  });

  it('resolves artifact paths against the root directory it is loaded from', async () => {
    await saveMakeResults(
      outDir,
      [makeResult(rootDir, 'linux', 'x64', 'app.deb')],
      rootDir,
    );
    const otherRoot = path.join(rootDir, 'elsewhere');

    const [[result]] = await loadMakeResults(outDir, otherRoot);

    expect(result.artifacts).toEqual([
      path.join(otherRoot, 'out', 'make', 'app.deb'),
    ]);
  });

  it('loads manifests written with Windows path separators', async () => {
    const dir = getMakeResultsDir(outDir);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, 'abc.forge-make.json'),
      JSON.stringify([
        {
          artifacts: ['out\\make\\app.exe'],
          packageJSON: {},
          platform: 'win32',
          arch: 'x64',
        },
      ]),
    );

    const [[result]] = await loadMakeResults(outDir, rootDir);

    expect(result.artifacts).toEqual([
      path.join(rootDir, 'out', 'make', 'app.exe'),
    ]);
  });

  it('keeps results from other platforms and architectures', async () => {
    await saveMakeResults(
      outDir,
      [makeResult(rootDir, 'darwin', 'arm64', 'app.dmg')],
      rootDir,
    );
    await saveMakeResults(
      outDir,
      [makeResult(rootDir, 'win32', 'x64', 'app.exe')],
      rootDir,
    );

    const makeRuns = await loadMakeResults(outDir, rootDir);

    expect(makeRuns).toHaveLength(2);
    expect(makeRuns.flat().map((r) => `${r.platform}/${r.arch}`)).toEqual(
      expect.arrayContaining(['darwin/arm64', 'win32/x64']),
    );
  });

  it('replaces previously saved results for the same platform and architecture', async () => {
    await saveMakeResults(
      outDir,
      [makeResult(rootDir, 'linux', 'x64', 'old.deb')],
      rootDir,
    );
    await saveMakeResults(
      outDir,
      [makeResult(rootDir, 'linux', 'x64', 'new.deb')],
      rootDir,
    );

    const makeRuns = await loadMakeResults(outDir, rootDir);

    expect(makeRuns).toHaveLength(1);
    expect(makeRuns[0][0].artifacts).toEqual([
      path.join(rootDir, 'out', 'make', 'new.deb'),
    ]);
  });

  it('only removes the stale entries from a manifest that covers several architectures', async () => {
    await saveMakeResults(
      outDir,
      [
        makeResult(rootDir, 'darwin', 'x64', 'old-x64.dmg'),
        makeResult(rootDir, 'darwin', 'arm64', 'old-arm64.dmg'),
      ],
      rootDir,
    );
    await saveMakeResults(
      outDir,
      [makeResult(rootDir, 'darwin', 'arm64', 'new-arm64.dmg')],
      rootDir,
    );

    const artifacts = (await loadMakeResults(outDir, rootDir))
      .flat()
      .flatMap((r) => r.artifacts.map((a) => path.basename(a)))
      .sort();

    expect(artifacts).toEqual(['new-arm64.dmg', 'old-x64.dmg']);
  });

  it('only replaces the results of the makers that were re-run', async () => {
    await saveMakeResults(
      outDir,
      [
        makerResult(rootDir, 'deb', 'old.deb'),
        makerResult(rootDir, 'rpm', 'old.rpm'),
        makerResult(rootDir, 'zip', 'old.zip'),
      ],
      rootDir,
    );
    // e.g. `make --targets @electron-forge/maker-zip` on the same machine
    await saveMakeResults(
      outDir,
      [makerResult(rootDir, 'zip', 'new.zip')],
      rootDir,
    );

    await expect(savedArtifactNames(outDir, rootDir)).resolves.toEqual([
      'new.zip',
      'old.deb',
      'old.rpm',
    ]);
  });

  it('replaces results without a maker name by platform and arch', async () => {
    await saveMakeResults(
      outDir,
      [
        makerResult(rootDir, 'deb', 'old.deb'),
        makeResult(rootDir, 'linux', 'x64', 'old-unnamed.zip'),
        makeResult(rootDir, 'darwin', 'arm64', 'old.dmg'),
      ],
      rootDir,
    );
    await saveMakeResults(
      outDir,
      [makeResult(rootDir, 'linux', 'x64', 'new-unnamed.zip')],
      rootDir,
    );

    await expect(savedArtifactNames(outDir, rootDir)).resolves.toEqual([
      'new-unnamed.zip',
      'old.dmg',
    ]);
  });

  it('removes manifests that can no longer be parsed instead of failing', async () => {
    await saveMakeResults(
      outDir,
      [makeResult(rootDir, 'darwin', 'arm64', 'app.dmg')],
      rootDir,
    );
    const dir = getMakeResultsDir(outDir);
    const truncated = path.join(dir, 'truncated.forge-make.json');
    await fs.writeFile(truncated, '[{"artifacts":["out/make/app.d');

    await expect(
      saveMakeResults(
        outDir,
        [makeResult(rootDir, 'linux', 'x64', 'app.deb')],
        rootDir,
      ),
    ).resolves.toBeDefined();

    await expect(fs.readdir(dir)).resolves.not.toContain(
      'truncated.forge-make.json',
    );
    await expect(fs.readdir(dir)).resolves.not.toContainEqual(
      expect.stringMatching(/\.tmp$/),
    );
    await expect(savedArtifactNames(outDir, rootDir)).resolves.toEqual([
      'app.deb',
      'app.dmg',
    ]);
  });

  it('refuses to load a manifest that cannot be parsed', async () => {
    const dir = getMakeResultsDir(outDir);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'truncated.forge-make.json'), '[{');

    await expect(loadMakeResults(outDir, rootDir)).rejects.toThrowError(
      /truncated\.forge-make\.json could not be read/,
    );
  });

  it('throws a helpful error when nothing has been saved', async () => {
    await expect(loadMakeResults(outDir, rootDir)).rejects.toThrowError(
      /No saved make results were found in .*make-results/,
    );

    await fs.mkdir(getMakeResultsDir(outDir), { recursive: true });
    await expect(loadMakeResults(outDir, rootDir)).rejects.toThrowError(
      /No saved make results were found/,
    );
  });
});

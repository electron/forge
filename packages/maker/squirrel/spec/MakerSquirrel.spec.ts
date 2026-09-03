import os from 'node:os';
import path from 'node:path';

import { createWindowsInstaller } from 'electron-winstaller';
import fs from 'fs-extra';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MakerSquirrel } from '../src/MakerSquirrel';

vi.mock(import('electron-winstaller'), async (importOriginal) => {
  const mod = await importOriginal<typeof import('electron-winstaller')>();
  return {
    ...mod,
    createWindowsInstaller: vi.fn().mockResolvedValue(undefined),
  };
});

describe('MakerSquirrel', () => {
  let dir: string;
  let makeDir: string;

  const makeWithVersion = async (version: string) => {
    const maker = new MakerSquirrel({}, []);
    return maker.make({
      dir,
      makeDir,
      targetArch: process.arch,
      appName: 'My Test App',
      forgeConfig: { packagerConfig: {} },
      packageJSON: { version },
    } as Parameters<typeof maker.make>[0]);
  };

  beforeEach(async () => {
    vi.mocked(createWindowsInstaller).mockClear();
    dir = path.resolve(os.tmpdir(), `forge-squirrel-test-${Date.now()}`);
    makeDir = path.resolve(os.tmpdir(), `forge-squirrel-make-${Date.now()}`);
    await fs.ensureDir(dir);
    await fs.writeJson(path.resolve(dir, 'package.json'), {
      name: 'my-app',
      version: '1.0.1-0',
    });
  });

  it('normalizes semver prerelease versions to a 4-part version for Squirrel', async () => {
    await makeWithVersion('1.0.1-0');

    expect(createWindowsInstaller).toHaveBeenCalledTimes(1);
    const config = vi.mocked(createWindowsInstaller).mock.calls[0][0];
    expect(config.version).toEqual('1.0.1.0');
  });

  it('keeps plain 3-part versions working and appends the revision digit', async () => {
    await makeWithVersion('1.2.3');

    const config = vi.mocked(createWindowsInstaller).mock.calls[0][0];
    expect(config.version).toEqual('1.2.3.0');
  });
});

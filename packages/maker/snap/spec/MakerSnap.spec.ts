import path from 'node:path';

import { MakerOptions } from '@electron-forge/maker-base';
import { describe, expect, it, vi } from 'vitest';

import { MakerSnap } from '../src/MakerSnap';

import installer from 'electron-installer-snap';
import { ForgeArch } from '@electron-forge/shared-types';

vi.mock('electron-installer-snap', () => {
  return {
    default: vi.fn(),
  };
});

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

describe('MakerSnap', () => {
  const dir = '/my/test/dir/out/foo-linux-x64';
  const makeDir = path.resolve('/make/dir');
  const appName = 'My Test App';
  const targetArch = process.arch as ForgeArch;
  const packageJSON = { version: '1.2.3' };

  it('should pass through correct defaults', async () => {
    const maker = new MakerSnap({}, []);
    maker.ensureDirectory = vi.fn();
    await maker.prepareConfig(targetArch);
    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    expect(vi.mocked(installer)).toHaveBeenCalledWith({
      arch: process.arch,
      src: dir,
      dest: path.resolve(makeDir, 'snap', process.arch),
    });
  });

  it('should have config cascade correctly', async () => {
    const maker = new MakerSnap(
      {
        arch: 'overridden',
        description: 'Snap description',
      },
      [],
    );
    maker.ensureDirectory = vi.fn();
    await maker.prepareConfig(targetArch);
    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    expect(vi.mocked(installer)).toHaveBeenCalledWith({
      arch: process.arch,
      src: dir,
      dest: path.resolve(makeDir, 'snap', process.arch),
      description: 'Snap description',
    });
  });
});

import path from 'node:path';

import { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch } from '@electron-forge/shared-types';
// @ts-expect-error - this package has no types
import installer from 'electron-installer-debian';
import { describe, expect, it, vi } from 'vitest';

import { debianArch, MakerDeb } from '../src/MakerDeb';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

const dir = '/my/test/dir/out';
const makeDir = path.resolve('/foo/bar/make');
const appName = 'My Test App';
const targetArch = process.arch as ForgeArch;
const packageJSON = { version: '1.2.3' };

vi.mock('electron-installer-debian', () => {
  return {
    default: vi.fn().mockResolvedValue({ packagePaths: ['/foo/bar.deb'] }),
  };
});

describe('MakerDeb', () => {
  it('should pass through correct defaults', async () => {
    const maker = new MakerDeb({}, []);
    maker.ensureDirectory = vi.fn();
    await maker.prepareConfig(targetArch);
    // FIXME: Why do we need to cast as MakeFunction here?
    // Should the types just be looser if this works on runtime?
    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });

    expect(vi.mocked(installer)).toHaveBeenCalledOnce();
    expect(vi.mocked(installer)).toHaveBeenCalledWith({
      arch: debianArch(process.arch as ForgeArch),
      options: {},
      src: dir,
      dest: path.join(makeDir, 'deb', process.arch),
      rename: undefined,
    });
    expect(maker.config).toEqual({});
  });

  it('should have config cascade correctly', async () => {
    const config = {
      arch: 'overridden',
      options: {
        productName: 'Debian',
      },
    } as Record<string, unknown>;

    const maker = new MakerDeb(config, []);
    maker.ensureDirectory = vi.fn();
    await maker.prepareConfig(targetArch);

    await (maker.make as MakeFunction)({
      dir,
      makeDir,
      appName,
      targetArch,
      packageJSON,
    });
    expect(vi.mocked(installer)).toHaveBeenCalledOnce();
    expect(vi.mocked(installer)).toHaveBeenCalledWith({
      arch: debianArch(process.arch as ForgeArch),
      options: {
        productName: 'Debian',
      },
      src: dir,
      dest: path.join(makeDir, 'deb', process.arch),
      rename: undefined,
    });
  });
});

describe('debianArch', () => {
  it('should convert ia32 to i386', () => {
    expect(debianArch('ia32')).toEqual('i386');
  });

  it('should convert x64 to amd64', () => {
    expect(debianArch('x64')).toEqual('amd64');
  });

  it('should convert armv7l to armhf', () => {
    expect(debianArch('armv7l')).toEqual('armhf');
  });

  it('should leave unknown values alone', () => {
    expect(debianArch('foo' as ForgeArch)).toEqual('foo');
  });
});

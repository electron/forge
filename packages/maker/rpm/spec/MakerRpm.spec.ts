import path from 'node:path';

import { MakerOptions } from '@electron-forge/maker-base';
import { ForgeArch } from '@electron-forge/shared-types';
import { describe, expect, it, vi } from 'vitest';

import { MakerRpm, rpmArch } from '../src/MakerRpm';

// @ts-expect-error - this package has no types
import installer from 'electron-installer-redhat';

type MakeFunction = (opts: Partial<MakerOptions>) => Promise<string[]>;

vi.mock('electron-installer-redhat', () => {
  return {
    default: vi.fn().mockResolvedValue({ packagePaths: ['/foo/bar.rpm'] }),
  };
});

describe('MakerRpm', () => {
  const dir = '/my/test/dir/out';
  const makeDir = path.resolve('/make/dir');
  const appName = 'My Test App';
  const targetArch = process.arch as ForgeArch;
  const packageJSON = { version: '1.2.3' };

  it('should pass through correct defaults', async () => {
    const maker = new MakerRpm({}, []);
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
      arch: rpmArch(process.arch as ForgeArch),
      src: dir,
      rename: expect.anything(),
      dest: path.join(makeDir, 'rpm', process.arch),
    });
  });

  it('should have config cascade correctly', async () => {
    const maker = new MakerRpm(
      {
        //@ts-expect-error intentionally passing in bad value
        arch: 'overridden',
        options: {
          productName: 'Redhat',
        },
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
    expect(vi.mocked(installer)).toHaveBeenCalledOnce();
    expect(vi.mocked(installer)).toHaveBeenCalledWith({
      arch: rpmArch(process.arch as ForgeArch),
      options: {
        productName: 'Redhat',
      },
      src: dir,
      rename: expect.anything(),
      dest: path.join(makeDir, 'rpm', process.arch),
    });
  });
});

describe('rpmArch', () => {
  it('should convert ia32 to i386', () => {
    expect(rpmArch('ia32')).toEqual('i386');
  });

  it('should convert x64 to x86_64', () => {
    expect(rpmArch('x64')).toEqual('x86_64');
  });

  it('should convert arm64 to aarch64', () => {
    expect(rpmArch('arm64')).toEqual('aarch64');
  });

  it('should convert armv7l to armv7hl', () => {
    expect(rpmArch('armv7l')).toEqual('armv7hl');
  });

  it('should leave unknown values alone', () => {
    expect(rpmArch('foo' as ForgeArch)).toEqual('foo');
  });
});

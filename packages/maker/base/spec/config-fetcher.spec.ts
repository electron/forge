import { describe, expect, it, vi } from 'vitest';

import { MakerBase } from '../src/Maker';

class MakerImpl extends MakerBase<{ a: number }> {
  name = 'test';
  defaultPlatforms = [];
}

describe('prepareConfig', () => {
  it('should accept sync configure functions', async () => {
    const fetcher = vi.fn();
    fetcher.mockReturnValue({
      a: 123,
    });
    const maker = new MakerImpl(fetcher, []);
    await maker.prepareConfig('x64');
    expect(maker.config).toEqual({
      a: 123,
    });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith('x64');
  });

  it('should accept async configure functions', async () => {
    const fetcher = vi.fn();
    fetcher.mockResolvedValue({
      a: 123,
    });
    const maker = new MakerImpl(fetcher, []);
    await maker.prepareConfig('x64');
    expect(maker.config).toEqual({
      a: 123,
    });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith('x64');
  });

  it('should hand through the provided object', async () => {
    const maker = new MakerImpl(
      {
        a: 234,
      },
      [],
    );
    expect(maker.config).toEqual({
      a: 234,
    });
    await maker.prepareConfig('x64');
    expect(maker.config).toEqual({
      a: 234,
    });
  });

  it('should resolve the config per architecture on clones', async () => {
    const fetcher = vi.fn((arch: string) => ({ a: arch === 'x64' ? 1 : 2 }));
    const maker = new MakerImpl(fetcher, []);
    const x64Maker = maker.clone();
    const arm64Maker = maker.clone();
    await x64Maker.prepareConfig('x64');
    await arm64Maker.prepareConfig('arm64');
    expect(x64Maker.config).toEqual({ a: 1 });
    expect(arm64Maker.config).toEqual({ a: 2 });
    expect(maker.config).toBeUndefined();
  });
});

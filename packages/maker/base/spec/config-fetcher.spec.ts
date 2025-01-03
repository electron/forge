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
      []
    );
    expect(maker.config).toBeUndefined();
    await maker.prepareConfig('x64');
    expect(maker.config).toEqual({
      a: 234,
    });
  });
});

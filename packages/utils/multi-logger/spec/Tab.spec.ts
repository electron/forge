import { describe, expect, it, vi } from 'vitest';

import Tab from '../src/Tab';

const makeTab = (maxLines = 5) => {
  const listener = { onLines: vi.fn(), onStatus: vi.fn(), onClear: vi.fn() };
  return { tab: new Tab('Main', 'cyan', maxLines, listener), listener };
};

describe('Tab', () => {
  it('splits logged text into lines and notifies the listener', () => {
    const { tab, listener } = makeTab();
    tab.log('one\ntwo\n');
    expect(tab.getLines()).toEqual(['one', 'two']);
    expect(listener.onLines).toHaveBeenCalledWith(tab, ['one', 'two']);
  });

  it('ignores empty writes', () => {
    const { tab, listener } = makeTab();
    tab.log('');
    expect(tab.lineCount).toBe(0);
    expect(listener.onLines).not.toHaveBeenCalled();
  });

  it('keeps only the most recent maxLines lines', () => {
    const { tab } = makeTab(3);
    tab.log('1\n2');
    tab.log('3\n4\n5');
    expect(tab.getLines()).toEqual(['3', '4', '5']);

    tab.log(Array.from({ length: 10 }, (_, i) => `x${i}`).join('\n'));
    expect(tab.getLines()).toEqual(['x7', 'x8', 'x9']);
  });

  it('starts idle and reports status changes', () => {
    const { tab, listener } = makeTab();
    expect(tab.status).toEqual({ state: 'idle' });
    tab.setStatus({ state: 'error', errors: 2 });
    expect(tab.status).toEqual({ state: 'error', errors: 2 });
    expect(listener.onStatus).toHaveBeenCalledWith(tab);
  });

  it('clears its buffer', () => {
    const { tab, listener } = makeTab();
    tab.log('a\nb');
    tab.clear();
    expect(tab.getLines()).toEqual([]);
    expect(listener.onClear).toHaveBeenCalledWith(tab);
  });
});

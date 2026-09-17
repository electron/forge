import { Box, Text, useInput, useStdout } from 'ink';
import { useEffect, useReducer, useRef, useState } from 'react';
import stringWidth from 'string-width';
import wrapAnsi from 'wrap-ansi';

import { describeStatus } from '../format.js';
import Logger from '../Logger.js';
import Tab from '../Tab.js';
import { LoggerKey, TabState } from '../types.js';

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
// Separator and footer; the tab bar adds one or more rows on top of these.
const FIXED_CHROME_ROWS = 2;
// Enough to fill any sane terminal height; the body only renders this slice.
const MAX_BODY_LINES = 300;
export const DEFAULT_ERROR_SWITCH_DEBOUNCE_MS = 15_000;

export interface AppProps {
  logger: Logger;
  title?: string;
  keys: LoggerKey[];
  /** Name of the tab (or `'all'`) shown first. Falls back to the first tab. */
  initialTab?: string;
  /** Minimum gap between two automatic switches to a tab that failed. */
  errorSwitchDebounceMs?: number;
  onQuit: () => void;
}

type View = number | 'all';

interface BodyLine {
  tab: Tab | null;
  text: string;
}

interface ChipSpec {
  key: string;
  hotkey: string;
  label: string;
  active: boolean;
  status?: { glyph: string; color: string; short: string };
}

interface HeaderLayout {
  showTitle: boolean;
  /** Whether the dim status text (durations, counts) is shown after the glyph. */
  showDetail: boolean;
  /** Rows the tab bar occupies. */
  rows: number;
}

const useTerminalSize = () => {
  const { stdout } = useStdout();
  const read = () => ({
    columns: stdout.columns || 80,
    rows: stdout.rows || 24,
  });
  const [size, setSize] = useState(read);
  useEffect(() => {
    const onResize = () => setSize(read());
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);
  return size;
};

/**
 * Re-renders (at most once per animation frame) whenever the logger changes.
 */
const useLoggerUpdates = (logger: Logger) => {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    const schedule = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        bump();
      }, 16);
    };
    const unsubscribe = logger.subscribe({
      onTab: schedule,
      onLines: schedule,
      onStatus: schedule,
      onClear: schedule,
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [logger]);
};

const useSpinner = (active: boolean) => {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => setFrame((f) => f + 1), 80);
    return () => clearInterval(interval);
  }, [active]);
  return SPINNER[frame % SPINNER.length];
};

/**
 * Switches to a tab the moment its status turns to `error`, at most once per
 * debounce window so a cascade of failures does not fight the user for the
 * view. A tab that stays in error does not re-trigger.
 */
const useErrorSwitch = (
  logger: Logger,
  debounceMs: number,
  switchTo: (view: View) => void,
) => {
  const lastSwitch = useRef(-Infinity);
  useEffect(() => {
    const states = new WeakMap<Tab, TabState>();
    for (const tab of logger.getTabs()) states.set(tab, tab.status.state);
    return logger.subscribe({
      onTab: (tab) => states.set(tab, tab.status.state),
      onStatus: (tab) => {
        const previous = states.get(tab);
        states.set(tab, tab.status.state);
        if (tab.status.state !== 'error' || previous === 'error') return;
        const now = Date.now();
        if (now - lastSwitch.current < debounceMs) return;
        const index = logger.getTabs().indexOf(tab);
        if (index === -1) return;
        lastSwitch.current = now;
        switchTo(index);
      },
    });
  }, [logger, debounceMs, switchTo]);
};

const CHIP_GAP = 1;
const TITLE_GAP = 2;

const chipText = (chip: ChipSpec, showDetail: boolean) => {
  let text = ` ${chip.hotkey} ${chip.label}`;
  if (chip.status) {
    text += ` ${chip.status.glyph}`;
    if (showDetail && chip.status.short) text += ` ${chip.status.short}`;
  }
  return `${text} `;
};

const sum = (widths: number[]) => widths.reduce((a, b) => a + b, 0);

/**
 * Decides how much of the tab bar fits in `columns`, degrading in steps: with
 * status details, without them, without the title, and finally wrapped onto
 * as many rows as needed so every chip (in particular the active one and
 * `All`) stays visible.
 */
export function layoutHeader(
  title: string | undefined,
  chips: ChipSpec[],
  columns: number,
): HeaderLayout {
  const titleWidth = title ? stringWidth(title) + TITLE_GAP : 0;
  const widths = (showDetail: boolean) =>
    chips.map((chip) => stringWidth(chipText(chip, showDetail)) + CHIP_GAP);

  if (titleWidth + sum(widths(true)) <= columns) {
    return { showTitle: Boolean(title), showDetail: true, rows: 1 };
  }
  const compact = widths(false);
  if (titleWidth + sum(compact) <= columns) {
    return { showTitle: Boolean(title), showDetail: false, rows: 1 };
  }
  if (sum(compact) <= columns) {
    return { showTitle: false, showDetail: false, rows: 1 };
  }
  // Mirrors Yoga's flex-wrap: a chip (including its gap) that does not fit
  // on the current row starts a new one.
  let rows = 1;
  let used = 0;
  for (const width of compact) {
    if (used > 0 && used + width > columns) {
      rows++;
      used = 0;
    }
    used += width;
  }
  return { showTitle: false, showDetail: false, rows };
}

/**
 * Screen rows a body line occupies once ink wraps it to `width`, measured
 * the same way ink does (`wrap-ansi`, hard wrap, no trimming).
 */
const wrappedRows = (text: string, width: number) => {
  if (width <= 0 || stringWidth(text) <= width) return 1;
  return wrapAnsi(text, width, { trim: false, hard: true }).split('\n').length;
};

const bodyText = (line: BodyLine) =>
  `${line.tab ? `[${line.tab.name}] ` : ''}${line.text || ' '}`;

/**
 * Keeps the tail of `lines` that fits in `maxRows` screen rows once wrapped,
 * so the body never grows past its box (which would squeeze the chrome).
 */
function fitToRows(
  lines: readonly BodyLine[],
  width: number,
  maxRows: number,
): { lines: readonly BodyLine[]; dropped: number } {
  let used = 0;
  let start = lines.length;
  while (start > 0) {
    const rows = wrappedRows(bodyText(lines[start - 1]), width);
    if (used > 0 && used + rows > maxRows) break;
    used += rows;
    start--;
  }
  return { lines: lines.slice(start), dropped: start };
}

function Chip({ chip, showDetail }: { chip: ChipSpec; showDetail: boolean }) {
  const { hotkey, label, active, status } = chip;
  return (
    <Box marginRight={CHIP_GAP} flexShrink={0}>
      <Text inverse={active} bold={active} wrap="truncate">
        {' '}
        <Text dimColor={!active}>{hotkey}</Text> {label}
        {status ? (
          <>
            {' '}
            {/* Colour on an inverse chip becomes a background cell. */}
            <Text color={active ? undefined : status.color}>
              {status.glyph}
            </Text>
            {showDetail && status.short ? (
              <Text dimColor> {status.short}</Text>
            ) : null}
          </>
        ) : null}{' '}
      </Text>
    </Box>
  );
}

export function App({
  logger,
  title,
  keys,
  initialTab,
  errorSwitchDebounceMs = DEFAULT_ERROR_SWITCH_DEBOUNCE_MS,
  onQuit,
}: AppProps) {
  const { columns, rows } = useTerminalSize();
  useLoggerUpdates(logger);

  const tabs = logger.getTabs();
  const [view, setView] = useState<View>(() => {
    const index = tabs.findIndex((tab) => tab.name === initialTab);
    if (index !== -1) return index;
    return initialTab === 'all' ? 'all' : 0;
  });
  // Lines back from the tail; only meaningful while not following.
  const [scroll, setScroll] = useState(0);
  const [follow, setFollow] = useState(true);

  const spinner = useSpinner(tabs.some((t) => t.status.state === 'building'));

  const [switchTo] = useState(() => (next: View) => {
    setView(next);
    setScroll(0);
    setFollow(true);
  });
  useErrorSwitch(logger, errorSwitchDebounceMs, switchTo);

  const activeTab = view === 'all' ? null : tabs[view];
  const total =
    view === 'all'
      ? logger.getMergedLines().length
      : (activeTab?.lineCount ?? 0);

  const chips: ChipSpec[] = tabs.map((tab, i) => {
    const status = describeStatus(tab.status);
    return {
      key: `tab:${tab.name}`,
      hotkey: String(i + 1),
      label: tab.name,
      active: view === i,
      status: {
        ...status,
        glyph: tab.status.state === 'building' ? spinner : status.glyph,
      },
    };
  });
  if (tabs.length > 0) {
    chips.push({
      key: 'all',
      hotkey: 'a',
      label: 'All',
      active: view === 'all',
    });
  }
  const header = layoutHeader(title, chips, columns);
  // Always leave at least one row for the body.
  const headerRows = Math.min(
    header.rows,
    Math.max(1, rows - FIXED_CHROME_ROWS - 1),
  );

  const bodyHeight = Math.max(1, rows - headerRows - FIXED_CHROME_ROWS);
  const maxScroll = Math.max(0, total - bodyHeight);
  const offset = follow ? 0 : Math.min(scroll, maxScroll);
  const end = total - offset;
  const start = Math.max(0, end - Math.min(bodyHeight, MAX_BODY_LINES));
  const candidates: readonly BodyLine[] =
    view === 'all'
      ? logger.getMergedLines().slice(start, end)
      : (activeTab?.getLines().slice(start, end) ?? []).map((text) => ({
          tab: null,
          text,
        }));
  const { lines: visible, dropped } = fitToRows(
    candidates,
    columns,
    bodyHeight,
  );
  const firstKey = start + dropped;

  const scrollBy = (delta: number) => {
    setFollow(false);
    setScroll((s) => Math.max(0, Math.min(maxScroll, s + delta)));
  };
  const resumeFollowing = () => {
    setFollow(true);
    setScroll(0);
  };

  useInput((input, key) => {
    if (key.ctrl && input === 'c') return onQuit();
    const custom = keys.find((k) => k.key === input && !key.ctrl && !key.meta);
    if (custom) return custom.onPress();

    const count = tabs.length;
    const current = view === 'all' ? count : view;
    // Views are 0..count-1 for tabs and `count` for "All".
    const fromIndex = (i: number): View => (i === count ? 'all' : i);
    if (key.rightArrow || (key.tab && !key.shift)) {
      return switchTo(fromIndex((current + 1) % (count + 1)));
    }
    if (key.leftArrow || (key.tab && key.shift)) {
      return switchTo(fromIndex((current + count) % (count + 1)));
    }
    if (/^[1-9]$/.test(input) && Number(input) <= count) {
      return switchTo(Number(input) - 1);
    }
    switch (input) {
      case 'q':
        return onQuit();
      case 'a':
        return switchTo('all');
      case 'c':
        if (view === 'all') {
          for (const tab of tabs) tab.clear();
        } else {
          activeTab?.clear();
        }
        return resumeFollowing();
      case 'f':
        return follow ? setFollow(false) : resumeFollowing();
      default:
    }
    if (key.upArrow) return scrollBy(1);
    if (key.downArrow) return scrollBy(-1);
    if (key.pageUp) return scrollBy(bodyHeight);
    if (key.pageDown) return scrollBy(-bodyHeight);
    if (key.home) return scrollBy(maxScroll);
    if (key.end) return resumeFollowing();
  });

  const hints = [
    '←/→ 1-9 tabs',
    'a all',
    ...keys.map((k) => `${k.key} ${k.label}`),
    'c clear',
    'f follow',
    '↑/↓ scroll',
    'q quit',
  ].join(' · ');

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      {/* The chrome never shrinks: overflowing body content is clipped instead. */}
      <Box height={headerRows} flexShrink={0} flexWrap="wrap" overflow="hidden">
        {header.showTitle ? (
          <Box marginRight={TITLE_GAP} flexShrink={0}>
            <Text bold wrap="truncate">
              {title}
            </Text>
          </Box>
        ) : null}
        {chips.map((chip) => (
          <Chip key={chip.key} chip={chip} showDetail={header.showDetail} />
        ))}
      </Box>
      <Text dimColor>{'─'.repeat(columns)}</Text>
      <Box
        flexGrow={1}
        flexDirection="column"
        justifyContent="flex-end"
        overflow="hidden"
      >
        {tabs.length === 0 ? (
          <Text dimColor>Waiting for output…</Text>
        ) : (
          visible.map((line, i) => (
            <Text key={firstKey + i} wrap="wrap">
              {line.tab ? (
                <Text color={line.tab.color}>[{line.tab.name}] </Text>
              ) : null}
              {line.text || ' '}
            </Text>
          ))
        )}
      </Box>
      <Box
        height={1}
        flexShrink={0}
        justifyContent="space-between"
        overflow="hidden"
        paddingRight={1}
      >
        <Text dimColor wrap="truncate">
          {hints}
        </Text>
        {!follow ? (
          <Text color="yellow" wrap="truncate">
            {' '}
            (scrolled ↑ {offset} lines · End to follow)
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}

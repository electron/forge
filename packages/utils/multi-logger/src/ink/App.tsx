import { Box, Text, useInput, useStdout } from 'ink';
import { useEffect, useReducer, useState } from 'react';

import { describeStatus } from '../format.js';
import Logger from '../Logger.js';
import Tab from '../Tab.js';
import { LoggerKey } from '../types.js';

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
// Tab bar, separator and footer.
const CHROME_ROWS = 3;
// Enough to fill any sane terminal height; the body only renders this slice.
const MAX_BODY_LINES = 300;

export interface AppProps {
  logger: Logger;
  title?: string;
  keys: LoggerKey[];
  onQuit: () => void;
}

type View = number | 'all';

interface BodyLine {
  tab: Tab | null;
  text: string;
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

function Chip({
  hotkey,
  label,
  active,
  status,
}: {
  hotkey: string;
  label: string;
  active: boolean;
  status?: { glyph: string; color: string; short: string };
}) {
  return (
    <Box marginRight={1} flexShrink={0}>
      <Text inverse={active} bold={active} wrap="truncate">
        {' '}
        <Text dimColor={!active}>{hotkey}</Text> {label}
        {status ? (
          <>
            {' '}
            <Text color={status.color}>{status.glyph}</Text>
            {status.short ? <Text dimColor> {status.short}</Text> : null}
          </>
        ) : null}{' '}
      </Text>
    </Box>
  );
}

export function App({ logger, title, keys, onQuit }: AppProps) {
  const { columns, rows } = useTerminalSize();
  useLoggerUpdates(logger);

  const tabs = logger.getTabs();
  const [view, setView] = useState<View>(0);
  // Lines back from the tail; only meaningful while not following.
  const [scroll, setScroll] = useState(0);
  const [follow, setFollow] = useState(true);

  const spinner = useSpinner(tabs.some((t) => t.status.state === 'building'));

  const activeTab = view === 'all' ? null : tabs[view];
  const total =
    view === 'all'
      ? logger.getMergedLines().length
      : (activeTab?.lineCount ?? 0);

  const bodyHeight = Math.max(1, rows - CHROME_ROWS);
  const maxScroll = Math.max(0, total - bodyHeight);
  const offset = follow ? 0 : Math.min(scroll, maxScroll);
  const end = total - offset;
  const start = Math.max(0, end - Math.min(bodyHeight, MAX_BODY_LINES));
  const visible: readonly BodyLine[] =
    view === 'all'
      ? logger.getMergedLines().slice(start, end)
      : (activeTab?.getLines().slice(start, end) ?? []).map((text) => ({
          tab: null,
          text,
        }));

  const switchTo = (next: View) => {
    setView(next);
    setScroll(0);
    setFollow(true);
  };
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
      <Box height={1} overflow="hidden">
        {title ? (
          <Box marginRight={2} flexShrink={0}>
            <Text bold wrap="truncate">
              {title}
            </Text>
          </Box>
        ) : null}
        {tabs.map((tab, i) => {
          const status = describeStatus(tab.status);
          return (
            <Chip
              key={tab.name}
              hotkey={String(i + 1)}
              label={tab.name}
              active={view === i}
              status={{
                ...status,
                glyph: tab.status.state === 'building' ? spinner : status.glyph,
              }}
            />
          );
        })}
        {tabs.length > 0 ? (
          <Chip hotkey="a" label="All" active={view === 'all'} />
        ) : null}
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
            <Text key={start + i} wrap="wrap">
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

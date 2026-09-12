# Multi Logger

> Display multiple streams of logs as tabs in the terminal

This module collects multiple logically separated streams of logs ("tabs") and
renders them in the terminal the process is already running in. When attached
to an interactive terminal it draws a full-screen tabbed UI with
[ink](https://github.com/vadimdemedes/ink); otherwise (CI, piped output) it
falls back to append-only lines prefixed with a colored tag. Lines may contain
ANSI styling, so anything that would render in a terminal can be piped in.

## Usage

```javascript
import Logger from '@electron-forge/multi-logger';

const logger = new Logger({ title: 'My tool' });

const serverTab = logger.createTab('Server');
const frontEndTab = logger.createTab('Front End');

// Everything logged before start() is buffered and shown once rendering begins.
serverTab.setStatus({ state: 'building' });
serverTab.log('listening on :3000');
serverTab.setStatus({ state: 'success', durationMs: 1200 });

// Pipe a child process's stdout/stderr into a tab of its own.
logger.attachProcess(spawn('node', ['server.js']), 'Server');

await logger.start();

// Later: restore the terminal. Safe to call more than once, and it also runs
// on process exit so a crash never leaves the terminal in the alternate screen.
logger.stop();
```

## API

### `new Logger(options?)`

| Option        | Description                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `stdout`      | Stream to render to. Defaults to `process.stdout`.                                               |
| `stdin`       | Stream to read keys from. Defaults to `process.stdin`.                                           |
| `interactive` | Whether the tabbed UI may be used. Defaults to `stdout.isTTY && stdin.isTTY && !process.env.CI`. |
| `forceMode`   | `'ink'` or `'plain'` to bypass detection.                                                        |
| `title`       | Text shown at the left of the tab bar.                                                           |
| `keys`        | Extra hotkeys, `{ key, label, onPress }`, listed in the footer.                                  |
| `maxLines`    | Lines kept per tab (and for the merged view). Defaults to 5000.                                  |

* `logger.createTab(name)` returns a `Tab`.
* `logger.getTab(name)` / `logger.getTabs()`.
* `logger.attachProcess(child, name = 'Electron')` pipes the child's `stdout` and
  `stderr` into a tab line by line and marks the tab as exited when it ends.
  A tab with the same name is reused, so a restarted process keeps its tab.
* `logger.start()` begins rendering. Before this everything is buffered.
* `logger.stop()` unmounts the UI and restores the terminal. If the UI never
  rendered, the buffered lines are written out as plain text instead so
  nothing is lost.

### `Tab`

* `tab.log(text)` appends text, which may contain many lines and ANSI colors.
* `tab.setStatus({ state, errors?, warnings?, durationMs?, detail? })` where
  `state` is one of `idle`, `building`, `success`, `warning`, `error` or
  `exited`. The status is shown next to the tab name.
* `tab.clear()` empties the tab's buffer.

## Interactive UI

```text
Electron Forge · webpack  1 Main Process ✔ 1.2s  2 Renderer (web) ⠹  3 Preload (electron-preload) ✖ 2  4 Electron ●  a All
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
… the active tab's most recent lines, wrapped to the terminal width …
←/→ 1-9 tabs · a all · r restart electron · c clear · f follow · ↑/↓ scroll · q quit
```

| Key                            | Action                                                    |
| ------------------------------ | --------------------------------------------------------- |
| `←` / `→`, `Tab` / `Shift+Tab` | Cycle through the tabs                                    |
| `1` to `9`                     | Jump to a tab                                             |
| `a`                            | Merged view of every tab, in arrival order, tagged by tab |
| `↑` / `↓`, `PgUp` / `PgDn`     | Scroll back through the buffer (stops following)          |
| `Home` / `End`                 | Jump to the oldest line / back to the tail                |
| `f`                            | Toggle following the tail                                 |
| `c`                            | Clear the current tab (or every tab in the merged view)   |
| `q`, `Ctrl+C`                  | Restore the terminal and re-raise `SIGINT`                |
| custom `keys`                  | Whatever the host registered, e.g. `r` to restart         |

The UI uses the terminal's alternate screen, so whatever was printed before
`start()` is still in the scrollback when it exits, and it prints a one-line
status per tab (plus the tail of any tab that ended in an error) on the way
out.

Because ink puts stdin into raw mode, line-based input such as typing `rs`
is not seen by the host process while the UI is up; hosts should register an
equivalent hotkey via `keys` instead.

## Plain mode

When stdout or stdin is not a TTY, or `CI` is set, lines are written as they
arrive:

```text
[Main Process]   asset index.js 1.2 KiB [emitted] (name: main)
[Main Process]   ✔ compiled in 1.2s
[Renderer (web)] ✖ failed with 1 error in 2.1s
```

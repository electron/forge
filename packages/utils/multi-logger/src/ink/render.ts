import { render } from 'ink';
import React from 'react';

import Logger from '../Logger.js';
import PlainRenderer from '../plain.js';
import { LoggerKey } from '../types.js';
import { App } from './App.js';

export interface StartInkOptions {
  logger: Logger;
  stdout: NodeJS.WriteStream;
  stdin: NodeJS.ReadStream;
  title?: string;
  keys: LoggerKey[];
  initialTab?: string;
  errorSwitchDebounceMs?: number;
  onQuit: () => void;
}

export function startInk({
  logger,
  stdout,
  stdin,
  ...props
}: StartInkOptions): {
  stop(): void;
} {
  const instance = render(React.createElement(App, { logger, ...props }), {
    stdout,
    stdin,
    // The UI owns the whole viewport; the terminal's own scrollback (with the
    // listr output that ran before us) is restored when we unmount.
    alternateScreen: true,
    // Ctrl+C is handled in the App so we can tear down before re-raising it.
    exitOnCtrlC: false,
  });

  return {
    stop() {
      instance.unmount();
      // The alternate screen is discarded on unmount, so leave a plain summary
      // (and the tail of any failed tab) behind in the real scrollback.
      new PlainRenderer(logger, stdout).printSummary();
    },
  };
}

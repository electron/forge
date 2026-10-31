import { EventEmitter } from 'node:events';

/**
 * Minimal stand-ins for the tty streams ink renders to and reads from, with
 * a configurable size. Modelled on ink-testing-library's, which is fixed at
 * 100 columns.
 */
export class FakeStdout extends EventEmitter {
  frames: string[] = [];

  isTTY = true;

  constructor(
    public columns = 100,
    public rows = 24,
  ) {
    super();
  }

  write = (frame: string): boolean => {
    this.frames.push(frame);
    return true;
  };

  lastFrame = (): string | undefined => this.frames.at(-1);
}

export class FakeStdin extends EventEmitter {
  isTTY = true;

  isRaw = false;

  private data: string | null = null;

  write = (data: string): void => {
    this.data = data;
    this.emit('readable');
    this.emit('data', data);
  };

  setEncoding(): void {
    // Nothing to do.
  }

  setRawMode(raw: boolean): void {
    this.isRaw = raw;
  }

  resume(): void {
    // Nothing to do.
  }

  pause(): void {
    // Nothing to do.
  }

  ref(): void {
    // Nothing to do.
  }

  unref(): void {
    // Nothing to do.
  }

  read = (): string | null => {
    const { data } = this;
    this.data = null;
    return data;
  };
}

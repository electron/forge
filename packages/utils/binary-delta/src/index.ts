import path from 'node:path';

/**
 * The Sparkle release that `BinaryDelta` comes from. Squirrel.Mac pins Sparkle
 * at this release (commit 79bc9e872948e47877e76f194cb0c8e0412b0b90).
 */
export const SPARKLE_VERSION = '2.9.5';

/**
 * Absolute path to Sparkle's `BinaryDelta` executable, a universal (x64 and
 * arm64) macOS binary.
 */
export const binaryDeltaPath = path.resolve(
  import.meta.dirname,
  '..',
  'bin',
  'BinaryDelta',
);

import path from 'node:path';

import { spawn } from '@malept/cross-spawn-promise';
import { describe, expect, it } from 'vitest';

function runForgeCLI(...extraArgs: string[]): Promise<string> {
  const args = [
    'ts-node',
    path.resolve(import.meta.dirname, '../src/electron-forge.ts'),
    ...extraArgs,
  ];
  return spawn('npx', args);
}

describe('cli', () => {
  it('should not fail on known subcommands', async () => {
    await expect(runForgeCLI('help')).resolves.toMatch(/Usage:/);
  });

  it('should fail on unknown subcommands', async () => {
    await expect(runForgeCLI('nonexistent')).rejects.toThrow(Error);
  });
});

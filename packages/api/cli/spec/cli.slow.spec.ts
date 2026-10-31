import path from 'node:path';

import { spawn } from '@malept/cross-spawn-promise';
import { describe, expect, it } from 'vitest';

function runForgeCLI(...extraArgs: string[]): Promise<string> {
  const args = [
    'tsx',
    path.resolve(import.meta.dirname, '../src/electron-forge.ts'),
    ...extraArgs,
  ];
  return spawn('yarn', args);
}

describe('cli', () => {
  it('should not fail on known subcommands', async () => {
    await expect(runForgeCLI('help')).resolves.toMatch(/Usage:/);
  });

  it('should fail on unknown subcommands', async () => {
    await expect(runForgeCLI('nonexistent')).rejects.toThrow(Error);
  });

  it('should list the release command in help output', async () => {
    await expect(runForgeCLI('help')).resolves.toMatch(/\brelease\b/);
  });

  it('should hide the deprecated publish alias from help output', async () => {
    await expect(runForgeCLI('help')).resolves.not.toMatch(/\bpublish\b/);
  });

  describe('make', () => {
    it('should list the --from-package option in help output', async () => {
      await expect(runForgeCLI('make', '--help')).resolves.toMatch(
        /--from-package/,
      );
    });

    it('should hide the deprecated --skip-package option from help output', async () => {
      await expect(runForgeCLI('make', '--help')).resolves.not.toMatch(
        /skip-package/,
      );
    });
  });

  describe('release', () => {
    it('should list the --from-make and --from-package options in help output', async () => {
      const help = await runForgeCLI('release', '--help');
      expect(help).toMatch(/--from-make/);
      expect(help).toMatch(/--from-package/);
    });

    it('should hide the deprecated dry run options from help output', async () => {
      await expect(runForgeCLI('release', '--help')).resolves.not.toMatch(
        /dry-run/,
      );
    });
  });
});

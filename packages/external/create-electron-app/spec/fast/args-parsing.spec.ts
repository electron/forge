import { describe, expect, it } from 'vitest';

import {
  getImportOptions,
  getInitOptions,
} from '../../src/create-electron-app.js';

// Commander expects argv in the format [execPath, scriptPath, ...args]
const argv = (args: string[]) => ['node', 'test', ...args];

describe('getInitOptions', () => {
  it('defaults dir to cwd when no dir argument', () => {
    const opts = getInitOptions(argv(['init']));
    expect(opts.dir).toBe(process.cwd());
  });

  it('defaults template to base', () => {
    const opts = getInitOptions(argv(['init']));
    expect(opts.template).toBe('base');
  });

  it('parses --template flag', () => {
    const opts = getInitOptions(argv(['init', '--template', 'vite']));
    expect(opts.template).toBe('vite');
  });

  it('parses -t shorthand', () => {
    const opts = getInitOptions(argv(['init', '-t', 'webpack']));
    expect(opts.template).toBe('webpack');
  });

  it('defaults copyCIFiles to false', () => {
    const opts = getInitOptions(argv(['init']));
    expect(opts.copyCIFiles).toBe(false);
  });

  it('parses --copy-ci-files flag', () => {
    const opts = getInitOptions(argv(['init', '--copy-ci-files']));
    expect(opts.copyCIFiles).toBe(true);
  });

  it('defaults force to false', () => {
    const opts = getInitOptions(argv(['init']));
    expect(opts.force).toBe(false);
  });

  it('parses --force flag', () => {
    const opts = getInitOptions(argv(['init', '--force']));
    expect(opts.force).toBe(true);
  });

  it('parses -f shorthand', () => {
    const opts = getInitOptions(argv(['init', '-f']));
    expect(opts.force).toBe(true);
  });

  it('defaults skipGit to false', () => {
    const opts = getInitOptions(argv(['init']));
    expect(opts.skipGit).toBe(false);
  });

  it('parses --skip-git flag', () => {
    const opts = getInitOptions(argv(['init', '--skip-git']));
    expect(opts.skipGit).toBe(true);
  });

  it('defaults electronVersion to latest', () => {
    const opts = getInitOptions(argv(['init']));
    expect(opts.electronVersion).toBe('latest');
  });

  it('parses --electron-version flag', () => {
    const opts = getInitOptions(argv(['init', '--electron-version', '38.3.0']));
    expect(opts.electronVersion).toBe('38.3.0');
  });

  it('defaults packageManager to npm@latest', () => {
    const opts = getInitOptions(argv(['init']));
    expect(opts.packageManager).toBe('npm@latest');
  });

  it('parses --package-manager flag', () => {
    const opts = getInitOptions(
      argv(['init', '--package-manager', 'yarn@1.22.22']),
    );
    expect(opts.packageManager).toBe('yarn@1.22.22');
  });

  it('uses init as default command (no subcommand)', () => {
    const opts = getInitOptions(argv([]));
    expect(opts.dir).toBe(process.cwd());
    expect(opts.template).toBe('base');
  });

  it('parses multiple flags together', () => {
    const opts = getInitOptions(
      argv([
        'init',
        '--template',
        'vite-typescript',
        '--force',
        '--skip-git',
        '--electron-version',
        'beta',
        '--package-manager',
        'pnpm@latest',
      ]),
    );
    expect(opts.template).toBe('vite-typescript');
    expect(opts.force).toBe(true);
    expect(opts.skipGit).toBe(true);
    expect(opts.electronVersion).toBe('beta');
    expect(opts.packageManager).toBe('pnpm@latest');
  });
});

describe('getImportOptions', () => {
  it('defaults dir to cwd when no dir argument', () => {
    const opts = getImportOptions(argv(['import']));
    expect(opts.dir).toBe(process.cwd());
  });

  it('defaults skipGit to false', () => {
    const opts = getImportOptions(argv(['import']));
    expect(opts.skipGit).toBe(false);
  });

  it('parses --skip-git flag', () => {
    const opts = getImportOptions(argv(['import', '--skip-git']));
    expect(opts.skipGit).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import { getMakeOptions } from '../src/electron-forge-make.js';
import { getPackageOptions } from '../src/electron-forge-package.js';
import { getPublishOptions } from '../src/electron-forge-publish.js';
import { getStartOptions } from '../src/electron-forge-start.js';

// Commander expects argv in the format [execPath, scriptPath, ...args]
const argv = (args: string[]) => ['node', 'test', ...args];

describe('getMakeOptions', () => {
  it('defaults arch to process.arch', () => {
    const opts = getMakeOptions(argv([]));
    expect(opts.arch).toBe(process.arch);
  });

  it('defaults platform to process.platform', () => {
    const opts = getMakeOptions(argv([]));
    expect(opts.platform).toBe(process.platform);
  });

  it('parses --arch flag', () => {
    const opts = getMakeOptions(argv(['--arch', 'arm64']));
    expect(opts.arch).toBe('arm64');
  });

  it('parses -a shorthand', () => {
    const opts = getMakeOptions(argv(['-a', 'ia32']));
    expect(opts.arch).toBe('ia32');
  });

  it('parses --platform flag', () => {
    const opts = getMakeOptions(argv(['--platform', 'linux']));
    expect(opts.platform).toBe('linux');
  });

  it('parses --targets as comma-separated list', () => {
    const opts = getMakeOptions(argv(['--targets', 'deb,rpm']));
    expect(opts.overrideTargets).toEqual(['deb', 'rpm']);
  });

  it('sets skipPackage when --skip-package is passed', () => {
    const opts = getMakeOptions(argv(['--skip-package']));
    expect(opts.skipPackage).toBe(true);
  });

  it('does not set overrideTargets by default', () => {
    const opts = getMakeOptions(argv([]));
    expect(opts.overrideTargets).toBeUndefined();
  });

  it('always sets interactive to true', () => {
    const opts = getMakeOptions(argv([]));
    expect(opts.interactive).toBe(true);
  });

  it('defaults dir to cwd when no dir argument', () => {
    const opts = getMakeOptions(argv([]));
    expect(opts.dir).toBe(process.cwd());
  });
});

describe('getPackageOptions', () => {
  it('defaults dir to cwd when no dir argument', () => {
    const opts = getPackageOptions(argv([]));
    expect(opts.dir).toBe(process.cwd());
  });

  it('parses --arch flag', () => {
    const opts = getPackageOptions(argv(['--arch', 'arm64']));
    expect(opts.arch).toBe('arm64');
  });

  it('parses --platform flag', () => {
    const opts = getPackageOptions(argv(['--platform', 'win32']));
    expect(opts.platform).toBe('win32');
  });

  it('does not set arch/platform by default', () => {
    const opts = getPackageOptions(argv([]));
    expect(opts.arch).toBeUndefined();
    expect(opts.platform).toBeUndefined();
  });

  it('always sets interactive to true', () => {
    const opts = getPackageOptions(argv([]));
    expect(opts.interactive).toBe(true);
  });
});

describe('getPublishOptions', () => {
  it('defaults dir to cwd when no dir argument', () => {
    const opts = getPublishOptions(argv([]));
    expect(opts.dir).toBe(process.cwd());
  });

  it('parses --target flag as comma-separated list', () => {
    const opts = getPublishOptions(argv(['--target', 'github,s3']));
    expect(opts.publishTargets).toEqual(['github', 's3']);
  });

  it('sets dryRun with --dry-run', () => {
    const opts = getPublishOptions(argv(['--dry-run']));
    expect(opts.dryRun).toBe(true);
  });

  it('sets dryRunResume with --from-dry-run', () => {
    const opts = getPublishOptions(argv(['--from-dry-run']));
    expect(opts.dryRunResume).toBe(true);
  });

  it('does not set publishTargets by default', () => {
    const opts = getPublishOptions(argv([]));
    expect(opts.publishTargets).toBeUndefined();
  });

  it('includes makeOptions from getMakeOptions', () => {
    const opts = getPublishOptions(argv(['--arch', 'arm64']));
    expect(opts.makeOptions).toBeDefined();
    expect(opts.makeOptions!.arch).toBe('arm64');
  });
});

describe('getStartOptions', () => {
  it('defaults dir to cwd when no dir argument', () => {
    const opts = getStartOptions(argv([]));
    expect(opts.dir).toBe(process.cwd());
  });

  it('parses --enable-logging flag', () => {
    const opts = getStartOptions(argv(['--enable-logging']));
    expect(opts.enableLogging).toBe(true);
  });

  it('parses -l shorthand for enable-logging', () => {
    const opts = getStartOptions(argv(['-l']));
    expect(opts.enableLogging).toBe(true);
  });

  it('parses --run-as-node flag', () => {
    const opts = getStartOptions(argv(['--run-as-node']));
    expect(opts.runAsNode).toBe(true);
  });

  it('parses --inspect-electron flag', () => {
    const opts = getStartOptions(argv(['--inspect-electron']));
    expect(opts.inspect).toBe(true);
  });

  it('parses --inspect-brk-electron flag', () => {
    const opts = getStartOptions(argv(['--inspect-brk-electron']));
    expect(opts.inspectBrk).toBe(true);
  });

  it('parses --app-path option', () => {
    const opts = getStartOptions(argv(['--app-path', '/some/path']));
    expect(opts.appPath).toBe('/some/path');
  });

  it('passes args after -- as app args', () => {
    const opts = getStartOptions(argv(['--', '-d', '-f', 'foo.txt']));
    expect(opts.args).toEqual(['-d', '-f', 'foo.txt']);
  });

  it('separates command args from app args', () => {
    const opts = getStartOptions(
      argv(['--enable-logging', '--', '--app-flag']),
    );
    expect(opts.enableLogging).toBe(true);
    expect(opts.args).toEqual(['--app-flag']);
  });

  it('strips ~ wrappers from app args with --vscode', () => {
    const opts = getStartOptions(
      argv(['--vscode', '--', '~--some-arg~', '~~']),
    );
    expect(opts.args).toEqual(['--some-arg']);
  });

  it('defaults boolean flags to false', () => {
    const opts = getStartOptions(argv([]));
    expect(opts.enableLogging).toBe(false);
    expect(opts.runAsNode).toBe(false);
    expect(opts.inspect).toBe(false);
    expect(opts.inspectBrk).toBe(false);
  });

  it('always sets interactive to true', () => {
    const opts = getStartOptions(argv([]));
    expect(opts.interactive).toBe(true);
  });
});

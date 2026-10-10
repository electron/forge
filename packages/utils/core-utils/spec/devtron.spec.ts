import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { canInjectDevtron, getDevtronBootstrapCode } from '../src/devtron';

async function makeProject({
  electronVersion,
  withDevtron,
}: {
  electronVersion?: string;
  withDevtron: boolean;
}): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'forge-devtron-spec-'));
  await fs.writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({
      name: 'devtron-spec-app',
      devDependencies: electronVersion ? { electron: electronVersion } : {},
    }),
  );
  if (withDevtron) {
    const devtronDir = path.join(dir, 'node_modules', '@electron', 'devtron');
    await fs.mkdir(devtronDir, { recursive: true });
    await fs.writeFile(
      path.join(devtronDir, 'package.json'),
      JSON.stringify({
        name: '@electron/devtron',
        version: '2.0.0',
        main: 'index.js',
      }),
    );
    await fs.writeFile(
      path.join(devtronDir, 'index.js'),
      'module.exports = {};\n',
    );
  }
  return dir;
}

describe('getDevtronBootstrapCode', () => {
  it('is valid JavaScript', () => {
    expect(() => new Function(getDevtronBootstrapCode())).not.toThrow();
  });

  it('guards against packaged apps and non-main processes', () => {
    const code = getDevtronBootstrapCode();
    expect(code).toContain('isPackaged');
    expect(code).toContain("process.type !== 'browser'");
    expect(code).toContain("require('@electron/devtron')");
  });
});

describe('canInjectDevtron', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when @electron/devtron is not installed', async () => {
    const dir = await makeProject({
      electronVersion: '36.0.0',
      withDevtron: false,
    });
    await expect(canInjectDevtron(dir)).rejects.toThrow(
      /@electron\/devtron.*could not be resolved/,
    );
  });

  it('returns true when devtron is installed and Electron is new enough', async () => {
    const dir = await makeProject({
      electronVersion: '36.0.0',
      withDevtron: true,
    });
    await expect(canInjectDevtron(dir)).resolves.toBe(true);
  });

  it('returns false with a warning when Electron is too old', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const dir = await makeProject({
      electronVersion: '35.0.0',
      withDevtron: true,
    });
    await expect(canInjectDevtron(dir)).resolves.toBe(false);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('requires Electron >= 36.0.0'),
    );
  });

  it('returns true when the Electron version cannot be determined', async () => {
    const dir = await makeProject({ withDevtron: true });
    await expect(canInjectDevtron(dir)).resolves.toBe(true);
  });
});

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import installDeps from '../../src/util/install-dependencies';

describe.runIf(!(process.platform === 'linux' && process.env.CI))('install-dependencies', () => {
  let installDir: string;

  beforeAll(async () => {
    const tmp = os.tmpdir();
    const tmpdir = path.join(tmp, 'electron-forge-test-');
    installDir = await fs.mkdtemp(tmpdir);
  });

  it('should install the latest minor version when the dependency has a caret', async () => {
    await installDeps(installDir, ['debug@^2.0.0']);

    const packageJSON = await import(path.resolve(installDir, 'node_modules', 'debug', 'package.json'));
    expect(packageJSON.version).not.toEqual('2.0.0');
  });

  afterAll(async () => fs.rm(installDir, { recursive: true, force: true }));
});

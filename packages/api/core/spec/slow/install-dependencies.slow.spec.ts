import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  installDependencies,
  PACKAGE_MANAGERS,
} from '@electron-forge/core-utils';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { pathToFileURL } from 'node:url';

/**
 * How old a release has to be before this test will install it, matching the
 * `npmMinimalAgeGate` the root `.yarnrc.yml` holds Yarn to. This test installs
 * from the public registry with no lockfile, so without a floor the caret below
 * picks up a brand new `2.x` the moment one is published.
 *
 * It holds it there with npm's `before` config — through the environment, since
 * `installDependencies` does not pass flags through — rather than npm's own
 * `min-release-age`, because this test also runs under the npm bundled with the
 * Node version in `.nvmrc`, which is older than that setting and would ignore it
 * without failing.
 */
const MINIMUM_RELEASE_AGE_DAYS = 7;

function releasedBefore(days: number): string {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}

describe.runIf(!(process.platform === 'linux' && process.env.CI))(
  'install-dependencies',
  () => {
    let installDir: string;

    beforeAll(async () => {
      const tmp = os.tmpdir();
      const tmpdir = path.join(tmp, 'electron-forge-test-');
      installDir = await fs.mkdtemp(tmpdir);
    });

    it('should install the latest minor version when the dependency has a caret', async () => {
      vi.stubEnv('npm_config_before', releasedBefore(MINIMUM_RELEASE_AGE_DAYS));

      await installDependencies(PACKAGE_MANAGERS['npm'], installDir, [
        'debug@^2.0.0',
      ]);

      const packageJSON = await import(
        pathToFileURL(
          path.resolve(installDir, 'node_modules', 'debug', 'package.json'),
        ).toString()
      );
      expect(packageJSON.version).not.toEqual('2.0.0');
    });

    afterAll(async () => {
      vi.unstubAllEnvs();
      await fs.rm(installDir, { recursive: true, force: true });
    });
  },
);

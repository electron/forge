import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { api } from '@electron-forge/core';
import {
  ensureTestDirIsNonexistent,
  updatePackageJSON,
} from '@electron-forge/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import { forgeImport } from '../../src/import';

describe('import', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await ensureTestDirIsNonexistent();
    await fs.promises.mkdir(dir);
    execSync(
      `git clone https://github.com/electron/minimal-repro.git . --quiet`,
      {
        cwd: dir,
      },
    );

    return async () => {
      await fs.promises.rm(dir, { recursive: true, force: true });
    };
  });

  it('creates forge.config.js and can successfully package the application', async () => {
    await updatePackageJSON(dir, async (packageJSON) => {
      packageJSON.name = 'Name';
      packageJSON.productName = 'ProductName';

      return packageJSON;
    });

    // FIXME: the install here will use the production version of Electron Forge
    // instead of the contents of this monorepo.
    await forgeImport({ dir });

    expect(fs.existsSync(path.join(dir, 'forge.config.js'))).toEqual(true);

    await api.package({ dir });

    const outDirContents = fs.readdirSync(path.join(dir, 'out'));
    expect(outDirContents).toHaveLength(1);
    expect(outDirContents[0]).toEqual(
      `ProductName-${process.platform}-${process.arch}`,
    );
  });
});

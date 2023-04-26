import path from 'path';

import { ForgeHookFn, PackageJSON } from '@electron-forge/shared-types';
import fs from 'fs-extra';

export const createCompileHook =
  (originalDir: string): ForgeHookFn<'packageAfterCopy'> =>
  async (_config, buildPath): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const compileCLI = require(path.resolve(originalDir, 'node_modules/electron-compile/lib/cli.js'));

    async function compileAndShim(appDir: string) {
      for (const entry of await fs.readdir(appDir)) {
        if (!entry.match(/^(node_modules|bower_components)$/)) {
          const fullPath = path.join(appDir, entry);

          if ((await fs.stat(fullPath)).isDirectory()) {
            const { log } = console;
            console.log = () => {
              /* disable log function for electron-compile */
            };
            await compileCLI.main(appDir, [fullPath]);
            console.log = log;
          }
        }
      }

      const packageJSON: PackageJSON = await fs.readJson(path.resolve(appDir, 'package.json'));

      const index = packageJSON.main || 'index.js';
      packageJSON.originalMain = index;
      packageJSON.main = 'es6-shim.js';

      await fs.writeFile(
        path.join(appDir, 'es6-shim.js'),
        await fs.readFile(path.join(path.resolve(originalDir, 'node_modules/electron-compile/lib/es6-shim.js')), 'utf8')
      );

      await fs.writeJson(path.join(appDir, 'package.json'), packageJSON, { spaces: 2 });
    }

    await compileAndShim(buildPath);
  };

import { spawn } from '@malept/cross-spawn-promise';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import debug from 'debug';
import { updatePackageJSON } from './index.js';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import os from 'node:os';

type SupportedPackageManager = 'npm' | 'pnpm' | 'yarn';

const supportedTemplates = [
  'base',
  'vite',
  'vite-typescript',
  'webpack',
  'webpack-typescript',
] as const;

type ModuleFormat = 'es' | 'cjs';

const supportedModuleFormats: ModuleFormat[] = ['cjs', 'es'];
type SupportedModuleFormats = typeof supportedModuleFormats;

export type TestForgeTemplateOptions = {
  /**
   * Note: `create-electron-app` always creates CommonJS projects; this option
   * is only here to allow us to test projects that have been manually changed
   * to ESM (either by programmatically updating the relevant project files in
   * the temporary test directory or by manually updating them in the Forge
   * checkout for local testing).
   */
  moduleFormats: SupportedModuleFormats;

  templateName: (typeof supportedTemplates)[number];
};

const d = debug('electron-forge:testForgeTemplate');

/**
 * Runs the local version of `create-electron-app` to create a project based on
 * a given Forge template using all supported package managers. Because this
 * test suite runs under Verdaccio, all ´@electron-forge/*` packages installed
 * by the templates are served from the file system and rebuilt before every
 * test run, which makes it easy to test local changes in the templates.
 *
 * At a high level, for each different package manager, this test suite:
 *
 * - creates a project with `create-electron-app`;
 *
 * - modifies the project's preload file so that it sends a "preload file ok"
 * IPC message to the main process once it has successfully loaded;
 *
 * - modifies the project's main process entrypoint so that it logs a "main
 * process ok" message. It also sets up a listener for the IPC message sent by
 * the preload file that logs a "preload file ok" when that message is received;
 *
 * - runs the project's `start` script and checks whether its output contains
 * the expected log messages;
 *
 * - checks whether the project includes a lock file that is consistent with the
 * package-manager used by `create-electron-app`.
 */
export function testForgeTemplate({
  moduleFormats,
  templateName,
}: TestForgeTemplateOptions) {
  describe(`${templateName} template`, () => {
    if (!moduleFormats.length) {
      d('`moduleFormats` is empty, defaulting to `cjs` only');

      moduleFormats = moduleFormats.concat('cjs');
    }

    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), 'electron-forge-test-'),
      );
    });

    const testCases: Array<
      [SupportedModuleFormats[number], SupportedPackageManager]
    > = moduleFormats.reduce(
      (acc, moduleFormat) => {
        const packageManagers: SupportedPackageManager[] = [
          'npm',
          'pnpm',
          'yarn',
        ];

        packageManagers.forEach((packageManager) => {
          acc.push([moduleFormat, packageManager]);
        });

        return acc;
      },
      [] as typeof testCases,
    );

    test.each(testCases)(
      `can launch a \`%s\` project created from \`template-${templateName}\` with \`%s\``,
      async (moduleFormat, packageManager) => {
        if (!supportedTemplates.includes(templateName)) {
          throw new Error(`unknown template ${templateName}`);
        }

        await spawn(
          'node',
          [
            path.resolve(
              __dirname,
              '../../../external/create-electron-app/dist/create-electron-app.js',
            ),
            tmpDir,
            `--template=${templateName}`,
            `--package-manager=${packageManager}`,
          ],
          {
            stdio: 'inherit',
          },
        );

        d('tmpdir: ', pathToFileURL(tmpDir).toString());

        const possiblePreloadFiles = ['preload.ts', 'preload.js'].map((item) =>
          path.resolve(tmpDir, `src/${item}`),
        );

        const possibleMainProcessEntrypoints = [
          'main.ts',
          'main.js',
          'index.ts',
          'index.js',
        ].map((item) => path.resolve(tmpDir, `src/${item}`));

        const preloadPath = possiblePreloadFiles.find((item) =>
          fs.existsSync(item),
        )!;
        const mainProcessEntrypoint = possibleMainProcessEntrypoints.find(
          (item) => fs.existsSync(item),
        )!;

        let missingPreloadFileError: Error | null = null;
        let missingMainProcessEntrypointError: Error | null = null;

        if (!preloadPath) {
          missingPreloadFileError = new Error(
            `"preload file not found in the following locations: ${JSON.stringify(possiblePreloadFiles, null, 2)}`,
          );
        }

        if (!mainProcessEntrypoint) {
          missingMainProcessEntrypointError = new Error(
            `"main process entrypoint not found in the following locations: ${JSON.stringify(possibleMainProcessEntrypoints, null, 2)}`,
          );
        }

        if (missingPreloadFileError || missingMainProcessEntrypointError) {
          throw new AggregateError(
            [missingPreloadFileError, missingMainProcessEntrypointError],
            'one or more files are missing',
          );
        }

        const preloadOkMessage = '__FORGE_INTERNAL_PRELOAD_PROCESS_OK__';
        const mainProcessOkMessage = '__FORGE_INTERNAL_MAIN_PROCESS_OK__';

        await fs.promises.appendFile(
          preloadPath,
          [
            '\n',
            moduleFormat === 'es'
              ? `import { ipcRenderer } from 'electron';`
              : `const { ipcRenderer } = require('electron');`,

            // If the preload file loads correctly, it will send this message to
            // the main process, which will in turn log it. Once the app exits
            // (either by calling `app.exit()` in our injected code upon
            // receiving this message or after the test times out), we check if
            // `electronForgeStartOutput` includes this string; if it doesn't,
            // it means the preload file failed to load for some reason.
            `ipcRenderer.send('${preloadOkMessage}')`,
          ].join('\n'),
        );

        await fs.promises.appendFile(
          mainProcessEntrypoint,
          [
            '\n',
            moduleFormat === 'es'
              ? `import { ipcMain } from 'electron';`
              : `const { ipcMain } =  require('electron');`,

            // This runs at the top-level and below all other template code, so
            // its presence in `electronForgeStartOutput` indicates that the
            // main process entrypoint must have been correctly parsed /
            // transpiled.
            `console.log('${mainProcessOkMessage}');`,

            // Logs the message that indicates that the preload file has been
            // correctly loaded.
            `
        ipcMain.on('${preloadOkMessage}', () => {
          console.log('${preloadOkMessage}');
          app.exit(0);
        });
        `,
          ].join('\n'),
        );

        // TODO decide if we want to keep this or remove it in favor of manually
        //  updating any files that need to change when moving a project to ESM.
        //  Non-TypeScript templates are left untouched since they'd also need
        //  `forge.config.js` to be converted to ESM.
        if (moduleFormat === 'es' && templateName.endsWith('-typescript')) {
          let mainProcessEntrypointContent = await fs.promises.readFile(
            mainProcessEntrypoint,
            { encoding: 'utf-8' },
          );

          const importElectronSquirrelStartup = `import started from 'electron-squirrel-startup';`;

          await fs.promises.writeFile(
            mainProcessEntrypoint,
            mainProcessEntrypointContent
              .replaceAll(/preload\.c?js/g, 'preload.js')
              .replaceAll('__dirname', 'import.meta.dirname')
              .replace(
                importElectronSquirrelStartup,
                [
                  '\n',
                  `import { createRequire } from 'node:module';`,
                  `const require = createRequire(import.meta.url);`,
                  `const started = require('electron-squirrel-startup')`,
                ].join('\n'),
              ),
          );

          await updatePackageJSON(tmpDir, async (packageJSON) => {
            packageJSON.type = 'module';

            (packageJSON.main as string).replace(/\.c?js/, '.js');

            return packageJSON;
          });
        }

        const electronForgeStartOutput = await spawn(
          packageManager,
          ['run', 'start'],
          {
            cwd: tmpDir,
            env: {
              PATH: process.env.PATH,
              ...(process.platform === 'linux' && {
                DISPLAY: process.env.DISPLAY,
                XAUTHORITY: process.env.XAUTHORITY,
              }),
              ...(packageManager !== 'yarn' && {
                /**
                 * HACK: when running the test script with Yarn on a npm/pnpm
                 * project created by `create-electron-app`,
                 * `process.env.npm_config_user_agent` can be something like
                 * `yarn/4.10.3 npm/? node/v24.14.1 win32 x64`, and Forge's
                 * `checkPackageManager` function takes this value to mean that
                 * the project _also_ uses Yarn, so `electron-forge start` ends
                 * up failing because there's no `yarn.lock` ([relevant
                 * code](https://github.com/electron/forge/blob/001f41befe2c049b6f54ce7d6c55e83435141055/packages/api/cli/src/util/check-system.ts#L108-L135)).
                 *
                 * Removing the `yarn/4.10.3` user agent causes Forge to
                 * correctly identify the project's package manager, but since
                 * the version information can be missing for npm in `npm/?`, it
                 * fails semver validation and Forge treats it like an
                 * unsupported npm version, so we also have to spoof a supported
                 * npm version number to work around that behavior.
                 */
                npm_config_user_agent: process.env
                  .npm_config_user_agent!.replace(/^yarn\/\d+\.\d+\.\d+ /i, '')
                  .replace(/\bnpm\/\?/, 'npm/10.0.0'),
              }),
            },
          },
        );

        d({ electronForgeStartOutput });

        const mainProcessOk =
          electronForgeStartOutput.includes(mainProcessOkMessage);
        const preloadProcessOk =
          electronForgeStartOutput.includes(preloadOkMessage);

        expect(mainProcessOk).toBe(true);
        expect(preloadProcessOk).toBe(true);

        const lockFile = (
          {
            npm: 'package-lock.json',
            pnpm: 'pnpm-lock.yaml',
            yarn: 'yarn.lock',
          } as Record<SupportedPackageManager, string>
        )[packageManager];

        expect(fs.existsSync(path.resolve(tmpDir, lockFile))).toBe(true);
      },
    );

    afterEach(async () => {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    });
  });
}

import { spawn } from '@malept/cross-spawn-promise';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import debug from 'debug';
import { updatePackageJSON } from './index.js';

const supportedTemplates = [
  'base',
  'vite',
  'vite-typescript',
  'webpack',
  'webpack-typescript',
] as const;

export const supportedPackageManagers = ['npm', 'pnpm', 'yarn'] as const;

export type TestForgeTemplateOptions = {
  /**
   * Note: `create-electron-app` always creates CommonJS projects; this option
   * is only here to allow us to test projects that have been manually changed
   * to ESM (either by programmatically updating the relevant project files in
   * the temporary test directory or by manually updating them in the Forge
   * checkout for local testing).
   */
  moduleFormat: 'es' | 'cjs';

  packageManager: (typeof supportedPackageManagers)[number];
  templateName: (typeof supportedTemplates)[number];
  tmpDir: string;
};

export async function testForgeTemplate({
  moduleFormat,
  packageManager,
  templateName,
  tmpDir,
}: TestForgeTemplateOptions): Promise<{
  mainProcessOk: boolean;
  preloadProcessOk: boolean;
}> {
  const d = debug('electron-forge:testForgeTemplate');

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

  const preloadPath = possiblePreloadFiles.find((item) => fs.existsSync(item))!;
  const mainProcessEntrypoint = possibleMainProcessEntrypoints.find((item) =>
    fs.existsSync(item),
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

      // If the preload file loads correctly, it will send this message to the
      // main process, which will in turn log it. Once the app exits (either
      // by calling `app.exit()` in our injected code upon receiving this
      // message or after the test times out), we check if
      // `electronForgeStartOutput` includes this string; if it doesn't, it
      // means the preload file failed to load for some reason.
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

      // This runs at the top-level and below all other template code, so its
      // presence in `electronForgeStartOutput` indicates that the main
      // process entrypoint must have been correctly parsed/transpiled.
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
    const mainProcessEntrypointContent = await fs.promises.readFile(
      mainProcessEntrypoint,
      { encoding: 'utf-8' },
    );

    mainProcessEntrypointContent
      .replaceAll(/preload\.c?js/g, 'preload.js')
      .replaceAll('__dirname', 'import.meta.dirname');

    await fs.promises.writeFile(
      mainProcessEntrypoint,
      mainProcessEntrypointContent,
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
      ...(packageManager !== 'yarn' && {
        env: {
          ...(process.platform === 'linux' && {
            DISPLAY: process.env.DISPLAY,
            XAUTHORITY: process.env.XAUTHORITY,
          }),
          PATH: process.env.PATH,
          /**
           * HACK: when running the test script with Yarn on a npm/pnpm project
           * created by `create-electron-app`, `process.env.npm_config_user_agent`
           * can be something like `yarn/4.10.3 npm/? node/v24.14.1 win32 x64`,
           * and Forge's `checkPackageManager` function takes this value to mean
           * that the project _also_ uses Yarn, so `electron-forge start` ends up
           * failing because there's no `yarn.lock` ([relevant code](https://github.com/electron/forge/blob/001f41befe2c049b6f54ce7d6c55e83435141055/packages/api/cli/src/util/check-system.ts#L108-L135)).
           *
           * Removing the `yarn/4.10.3` user agent causes Forge to correctly
           * identify the project's package manager, but since the version
           * information can be missing for npm in `npm/?`, it fails semver
           * validation and Forge treats it like an unsupported npm version, so we
           * also have to spoof a supported npm version number to work around that
           * behavior.
           */
          npm_config_user_agent: process.env
            .npm_config_user_agent!.replace(/^yarn\/\d+\.\d+\.\d+ /i, '')
            .replace(/\bnpm\/\?/, 'npm/10.0.0'),
        },
      }),
    },
  );

  d({ electronForgeStartOutput });

  return {
    mainProcessOk: electronForgeStartOutput.includes(mainProcessOkMessage),
    preloadProcessOk: electronForgeStartOutput.includes(preloadOkMessage),
  };
}

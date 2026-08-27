import { spawn } from '@malept/cross-spawn-promise';
import { spawn as spawnChild } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import debug from 'debug';
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

  /**
   * When set, adds a test that packages the scaffolded app with
   * `electron-forge package`, launches the packaged binary, and asserts that
   * the renderer window was served from a URL with this protocol — `app:` for
   * templates that enable the bundler plugins' `appProtocol` option. This is
   * the only place the injected `app://` runtime is exercised in a real
   * packaged app: `electron-forge start` serves renderers from the dev server.
   */
  packagedRendererProtocol?: 'app:' | 'file:';
};

const d = debug('electron-forge:testForgeTemplate');

/** Runs the local `create-electron-app` build to scaffold a project. */
function scaffoldProject(
  tmpDir: string,
  templateName: string,
  packageManager: SupportedPackageManager,
) {
  return spawn('node', [
    path.resolve(
      __dirname,
      '../../../external/create-electron-app/dist/create-electron-app.js',
    ),
    tmpDir,
    `--template=${templateName}`,
    `--package-manager=${packageManager}`,

    // Electron 41 is the last version that downloads its binary from a
    // `postinstall` script. Yarn 4.18 disables install scripts by
    // default (`enableScripts`), so on 41 the binary never gets
    // downloaded and `electron-forge start` fails with "Electron failed
    // to install correctly". Electron 42+ downloads the binary on demand
    // the first time it's needed instead, so no install script is
    // involved.
    `--electron-version=43.4.0`,
  ]);
}

/**
 * The environment for running a scaffolded project's Forge scripts (`start`,
 * `package`) through its package manager.
 */
function forgeScriptEnv(packageManager: SupportedPackageManager) {
  return {
    PATH: process.env.PATH,
    /**
     * Forge scripts make the package manager check the lockfile it just
     * wrote, and `XDG_CONFIG_HOME` is where the Verdaccio test harness
     * puts the config that tells pnpm which registry to use, how old a
     * release has to be, which packages are exempt, and to warn rather
     * than fail when the check finds a difference. Dropping it would
     * leave the check looking at the public registry under a policy
     * the install never ran under.
     */
    XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
    /**
     * `@electron/get` (which downloads the Electron binary during `start` and
     * `package`) and the package managers need the proxy configuration in
     * environments that route outbound traffic through one; these variables
     * are simply unset everywhere else.
     */
    ...Object.fromEntries(
      [
        'HTTP_PROXY',
        'HTTPS_PROXY',
        'NO_PROXY',
        'http_proxy',
        'https_proxy',
        'no_proxy',
        'NODE_EXTRA_CA_CERTS',
        'ELECTRON_GET_USE_PROXY',
        'GLOBAL_AGENT_HTTP_PROXY',
        'GLOBAL_AGENT_HTTPS_PROXY',
        'GLOBAL_AGENT_NO_PROXY',
      ]
        .filter((name) => process.env[name] !== undefined)
        .map((name) => [name, process.env[name]]),
    ),
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
        .replace(/\bnpm\/\?/, 'npm/99.99.99'),
    }),
  };
}

/**
 * Finds the preload file and main process entrypoint of a scaffolded project,
 * which is where the tests inject their IPC probes.
 */
function findProbeFiles(tmpDir: string) {
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

  return { preloadPath, mainProcessEntrypoint };
}

/**
 * Locates the executable `electron-forge package` produced for the current
 * platform. `initializePackageJSON` names the app after the project directory.
 */
function findPackagedExecutable(projectDir: string): string {
  const appName = path.basename(projectDir).toLowerCase();
  const outDir = path.join(projectDir, 'out');
  const bundleDirName = fs
    .readdirSync(outDir)
    .find((entry) => entry.startsWith(`${appName}-${process.platform}-`));
  if (!bundleDirName) {
    throw new Error(
      `no packaged bundle for ${appName} in ${outDir}, only: ${fs.readdirSync(outDir).join(', ')}`,
    );
  }
  const bundleDir = path.join(outDir, bundleDirName);
  switch (process.platform) {
    case 'darwin':
      return path.join(
        bundleDir,
        `${appName}.app`,
        'Contents',
        'MacOS',
        appName,
      );
    case 'win32':
      return path.join(bundleDir, `${appName}.exe`);
    default:
      return path.join(bundleDir, appName);
  }
}

/**
 * Launches a packaged app and resolves with its combined output once it
 * exits. The injected probe makes the app exit itself; the kill timer only
 * reaps a hung app so the assertion failure shows the collected output
 * instead of a bare test timeout.
 */
function runPackagedApp(executable: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // --no-sandbox: CI containers don't always support Chromium's sandbox
    // (e.g. when running as root); the probe only needs the window to load.
    const child = spawnChild(executable, ['--no-sandbox'], {
      env: { ...process.env },
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    const killTimer = setTimeout(() => child.kill('SIGKILL'), 120_000);
    child.on('error', (error) => {
      clearTimeout(killTimer);
      reject(error);
    });
    child.on('close', () => {
      clearTimeout(killTimer);
      resolve(output);
    });
  });
}

/**
 * Summarizes the layout a package manager installed into a project, which is
 * what tells a flat `node_modules` (npm, Yarn, pnpm with `nodeLinker: hoisted`)
 * apart from one where every package is a link into a store, and shows which
 * packages a failing app could have resolved.
 */
function describeDependencyTree(projectDir: string) {
  const nodeModules = path.join(projectDir, 'node_modules');

  let entries;
  try {
    entries = fs.readdirSync(nodeModules, { withFileTypes: true });
  } catch (error) {
    return `no readable \`node_modules\` in ${projectDir} (${error})`;
  }

  const names = entries
    .flatMap((entry) =>
      // Scopes hold the packages we care about rather than being one themselves.
      entry.name.startsWith('@')
        ? fs
            .readdirSync(path.join(nodeModules, entry.name))
            .map((scoped) => `${entry.name}/${scoped}`)
        : [entry.name],
    )
    .sort();

  return `${names.length} packages into ${nodeModules}: ${names.join(' ')}`;
}

/**
 * Everything the Verdaccio harness' pnpm shim recorded about the installs into
 * one project, which is the only account there is of them: pnpm's own output.
 */
function describePnpmInstalls(projectDir: string) {
  const invocationLog = process.env.FORGE_PNPM_INVOCATION_LOG;
  if (!invocationLog) return 'no record of the pnpm runs was kept';

  let records;
  try {
    records = fs.readFileSync(invocationLog, 'utf8').split(/^(?==== pnpm )/m);
  } catch (error) {
    return `no readable record of the pnpm runs in ${invocationLog} (${error})`;
  }

  const forThisProject = records.filter((record) =>
    record.includes(`in ${projectDir}`),
  );
  return forThisProject.length
    ? forThisProject.join('')
    : `nothing in ${invocationLog} mentions ${projectDir}`;
}

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
  packagedRendererProtocol,
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

        const createOutput = await scaffoldProject(
          tmpDir,
          templateName,
          packageManager,
        );

        d('tmpdir: ', pathToFileURL(tmpDir).toString());

        const { preloadPath, mainProcessEntrypoint } = findProbeFiles(tmpDir);

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

        const startApp = () =>
          spawn(packageManager, ['run', 'start'], {
            cwd: tmpDir,
            env: forgeScriptEnv(packageManager),
          });

        let electronForgeStartOutput: string;
        try {
          electronForgeStartOutput = await startApp();
        } catch (error) {
          /**
           * When `start` fails, it is usually because the package manager
           * installed a dependency tree the app cannot resolve its own
           * configuration from, and the failure alone doesn't say which tree it
           * ended up with. `create-electron-app` runs its steps with listr2's
           * `exitOnError: false`, so a failed install leaves a broken project
           * behind and still exits 0; its output is the only place that failure
           * is reported at all.
           */
          console.error(
            [
              `[template-tests] ${packageManager} installed ${describeDependencyTree(tmpDir)}`,
              `[template-tests] from this package.json:\n${fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8')}`,
              ...(packageManager === 'pnpm'
                ? [
                    `[template-tests] pnpm was run like this:\n${describePnpmInstalls(tmpDir)}`,
                  ]
                : []),
              `[template-tests] create-electron-app said:\n${createOutput}`,
            ].join('\n'),
          );

          throw error;
        }

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

    if (packagedRendererProtocol) {
      test(`a packaged \`template-${templateName}\` app serves its renderer over \`${packagedRendererProtocol}//\``, async () => {
        const packageManager: SupportedPackageManager = 'npm';
        const createOutput = await scaffoldProject(
          tmpDir,
          templateName,
          packageManager,
        );

        d('tmpdir: ', pathToFileURL(tmpDir).toString());

        const { preloadPath, mainProcessEntrypoint } = findProbeFiles(tmpDir);
        const rendererLocationMessage = '__FORGE_INTERNAL_RENDERER_LOCATION__';

        // The preload script runs inside the renderer after its navigation
        // has committed, so `window.location` is the URL the window was
        // actually served from — the thing the injected app:// runtime is
        // supposed to determine in packaged apps.
        await fs.promises.appendFile(
          preloadPath,
          [
            '\n',
            `const { ipcRenderer } = require('electron');`,
            `ipcRenderer.send('${rendererLocationMessage}', window.location.href);`,
          ].join('\n'),
        );

        await fs.promises.appendFile(
          mainProcessEntrypoint,
          [
            '\n',
            `const { ipcMain } = require('electron');`,
            `ipcMain.on('${rendererLocationMessage}', (_event, href) => {`,
            `  console.log('${rendererLocationMessage}:' + href);`,
            `  app.exit(0);`,
            `});`,
          ].join('\n'),
        );

        try {
          await spawn(packageManager, ['run', 'package'], {
            cwd: tmpDir,
            env: forgeScriptEnv(packageManager),
          });
        } catch (error) {
          console.error(
            `[template-tests] create-electron-app said:\n${createOutput}`,
          );
          throw error;
        }

        const output = await runPackagedApp(findPackagedExecutable(tmpDir));

        expect(output).toContain(
          `${rendererLocationMessage}:${packagedRendererProtocol}//`,
        );
      }, 480_000); // longer than the project-level timeout allows for. // Scaffolding, installing, packaging, and launching in one test takes
    }

    afterEach(async () => {
      await fs.promises.rm(tmpDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 500,
      });
    });
  });
}

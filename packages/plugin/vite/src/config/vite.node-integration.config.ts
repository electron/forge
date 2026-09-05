import { builtinModules, createRequire } from 'node:module';
import path from 'node:path';

import * as vite from 'vite';

import type { Plugin, UserConfig } from 'vite';

const electronModules = ['electron', 'electron/common', 'electron/renderer'];
const originalFsModules = ['original-fs', 'node:original-fs'];
const nodeIntegrationModules = new Set([
  ...electronModules,
  ...originalFsModules,
  ...builtinModules,
  ...builtinModules
    .filter((moduleName) => !moduleName.startsWith('node:'))
    .map((moduleName) => `node:${moduleName}`),
]);
const virtualModulePrefix = '\0electron-forge-node-integration:';
const identifierPattern = /^[$A-Z_][0-9A-Z_$]*$/i;
const nodeRequire = createRequire(
  path.join(process.cwd(), '__electron_forge_vite.cjs'),
);

// Electron's package cannot expose these names to Vite while it runs in Node:
// requiring it outside Electron returns the executable path instead.
//
// The list therefore has to be written out, and a name missing from it is a hard
// build failure -- Rollup reports `"X" is not exported by
// "<virtual>:electron"`, exactly as it would for a name that does not exist at
// all, so a genuine API and a typo fail identically.
//
// Maintaining it: take the runtime value exports, NOT the names in
// `electron.d.ts`. The two disagree. `ServiceWorkerMain` is only a `type` inside
// the typings' `CrossProcessExports` namespace, yet in Electron 39.2.6 the main
// process really does export it as a constructor (`typeof === 'function'`), so
// deriving this list from the typings silently drops it. The runtime is the
// ground truth for a bundler shim:
//
//   Object.keys(require('electron'))   // in the main process, and again in a
//                                      // nodeIntegration renderer
//
// The union of both processes is what belongs here. Names that resolve only in
// one process are still safe to list: the shim re-exports whatever the running
// process actually has, and a main-only API simply reads as `undefined` in a
// renderer -- which is what plain `require('electron')` does there too.
const electronExportNames = [
  'app',
  'autoUpdater',
  'BaseWindow',
  'BrowserView',
  'BrowserWindow',
  'clipboard',
  'contentTracing',
  'contextBridge',
  'crashReporter',
  'deprecate',
  'desktopCapturer',
  'dialog',
  'globalShortcut',
  'ImageView',
  'inAppPurchase',
  'ipcMain',
  'IpcMainServiceWorker',
  'ipcRenderer',
  'Menu',
  'MenuItem',
  'MessageChannelMain',
  'MessagePortMain',
  'nativeImage',
  'nativeTheme',
  'net',
  'netLog',
  'Notification',
  'parentPort',
  'powerMonitor',
  'powerSaveBlocker',
  'process',
  'protocol',
  'pushNotifications',
  'safeStorage',
  'screen',
  'ServiceWorkerMain',
  'session',
  'ShareMenu',
  'sharedTexture',
  'shell',
  'systemPreferences',
  'TouchBar',
  'Tray',
  'utilityProcess',
  'View',
  'webContents',
  'WebContentsView',
  'webFrame',
  'webFrameMain',
  'webUtils',
];

function getExportNames(source: string) {
  if (electronModules.includes(source)) return electronExportNames;

  const introspectionSource = originalFsModules.includes(source)
    ? 'node:fs'
    : source;
  return Object.getOwnPropertyNames(nodeRequire(introspectionSource));
}

function createRuntimeShim(source: string) {
  const exports = [...new Set(getExportNames(source))]
    .filter(
      (name) =>
        name !== 'default' &&
        name !== '__esModule' &&
        identifierPattern.test(name),
    )
    .map((name, index) => ({ binding: `export_${index}`, name }));
  const declarations = exports
    .map(
      ({ binding, name }) =>
        `const ${binding} = moduleValue[${JSON.stringify(name)}];`,
    )
    .join('\n');
  const namedExports = exports
    .map(({ binding, name }) => `  ${binding} as ${name},`)
    .join('\n');

  // `require` is called directly rather than through an alias. Rolldown (Vite 8+)
  // only rewrites syntactically-direct `require(...)` calls into its
  // external-module interop; assigning it first (`const runtimeRequire = require`)
  // and calling the alias produces a bundle with no `require` at all, and every
  // Electron export silently becomes `undefined`. Rollup accepted either form, so
  // this reads as a cosmetic difference and is not one.
  return `
const moduleValue = require(${JSON.stringify(source)});
const defaultExport = moduleValue?.default ?? moduleValue;
${declarations}
export {
  defaultExport as default,
${namedExports}
};
`;
}

function configureNodeIntegration(config: UserConfig) {
  config.optimizeDeps ??= {};
  config.optimizeDeps.exclude = [
    ...new Set([
      ...(config.optimizeDeps.exclude ?? []),
      ...nodeIntegrationModules,
    ]),
  ];

  config.build ??= {};
  config.build.commonjsOptions ??= {};
  const userIgnore = config.build.commonjsOptions.ignore;
  config.build.commonjsOptions.ignore =
    typeof userIgnore === 'function'
      ? (id) => nodeIntegrationModules.has(id) || userIgnore(id)
      : [...new Set([...(userIgnore ?? []), ...nodeIntegrationModules])];

  config.build.rollupOptions ??= {};
  const { output } = config.build.rollupOptions;
  // Rollup freezes the namespace object it builds for a CommonJS module, so the
  // `require` shims below would hand back a frozen `electron` namespace and any
  // consumer that assigns onto it (a common pattern in test setups) would throw
  // in strict mode. `output.freeze: false` opts out of that.
  //
  // Only Rollup has the option: Vite 8 bundles Rolldown, which never emits
  // `Object.freeze` at all, so the property is absent from its `OutputOptions`
  // and setting it would be both a type error and a no-op. `freeze` is therefore
  // written through a cast and only when the running Vite is Rollup-based.
  if (rollupSupportsFreeze()) {
    if (Array.isArray(output)) {
      for (const outputConfig of output) applyFreeze(outputConfig);
    } else {
      const merged = { ...output };
      applyFreeze(merged);
      config.build.rollupOptions.output = merged;
    }
  }
}

function applyFreeze(outputConfig: object) {
  const freezable = outputConfig as { freeze?: boolean };
  freezable.freeze ??= false;
}

/**
 * Whether the bundler behind `build.rollupOptions` understands `output.freeze`.
 * True for Rollup (Vite 6 and 7), false for Rolldown (Vite 8+), which never
 * emits `Object.freeze` and so does not need the opt-out.
 *
 * Vite only exports `rolldownVersion` from the Rolldown-based builds, so its
 * presence is the direct signal; a version-number check would need updating
 * every time Vite changes bundler.
 */
function rollupSupportsFreeze() {
  return (vite as { rolldownVersion?: string }).rolldownVersion === undefined;
}

export function pluginNodeIntegration(): Plugin {
  return {
    name: '@electron-forge/plugin-vite:node-integration',
    enforce: 'pre',
    config(config) {
      configureNodeIntegration(config);
    },
    resolveId(source, importer) {
      // Requests coming from inside our own shim must stay external. The shim's
      // body is `runtimeRequire("electron")`, which is meant to reach Electron's
      // runtime `require` at execution time, so the bundler has to leave it as a
      // `require` call rather than resolving it.
      //
      // Rollup left it alone by default. Rolldown (Vite 8+) does not, and both of
      // the other outcomes are silent:
      //   - claim it here again, and the virtual module resolves to itself:
      //     `init_x = __esmMin(() => { moduleValue = (init_x(), ...) })`. The
      //     self-call is swallowed by `__esmMin`'s `fn = 0` guard, so instead of
      //     recursing it yields `undefined` for every Electron export.
      //   - decline it, and Rolldown resolves `electron` to the npm package --
      //     which outside Electron is the *installer stub* -- and bundles
      //     `getElectronPath()` plus a "Downloading Electron binary..." branch
      //     into the renderer, with its own `fs`/`child_process` shimmed to
      //     `module.exports = {}` by `__vite-browser-external`.
      // Marking it external is what keeps a real `require` in the output.
      if (importer?.startsWith(virtualModulePrefix)) {
        return { id: source, external: true };
      }
      if (nodeIntegrationModules.has(source)) {
        return `${virtualModulePrefix}${source}`;
      }
    },
    load(id) {
      if (id.startsWith(virtualModulePrefix)) {
        return createRuntimeShim(id.slice(virtualModulePrefix.length));
      }
    },
  };
}

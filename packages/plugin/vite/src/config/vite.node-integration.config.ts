import { builtinModules, createRequire } from 'node:module';
import path from 'node:path';

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
        `const ${binding} = /*#__PURE__*/ (() => moduleValue[${JSON.stringify(name)}])();`,
    )
    .join('\n');
  const namedExports = exports
    .map(({ binding, name }) => `  ${binding} as ${name},`)
    .join('\n');

  return `
const runtimeRequire = require;
const moduleValue = runtimeRequire(${JSON.stringify(source)});
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
  if (Array.isArray(output)) {
    for (const outputConfig of output) outputConfig.freeze ??= false;
  } else {
    config.build.rollupOptions.output = {
      ...output,
      freeze: output?.freeze ?? false,
    };
  }
}

export function pluginNodeIntegration(): Plugin {
  return {
    name: '@electron-forge/plugin-vite:node-integration',
    enforce: 'pre',
    config(config) {
      configureNodeIntegration(config);
    },
    resolveId(source) {
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

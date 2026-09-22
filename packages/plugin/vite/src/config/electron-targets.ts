import { electronToChromium, versions } from 'electron-to-chromium';

/**
 * The Node.js version that each Electron major ships, used to derive Vite's
 * `build.target` for the main and preload bundles so they are not downleveled
 * for engines Electron never runs.
 *
 * The Node.js table is ported from electron-vite (MIT © 2022 Alex Wei,
 * https://github.com/alex8088/electron-vite, `src/electron.ts`), with the
 * Electron 40 entry corrected to the version that 40.0.0 shipped. Chromium is
 * not tabulated here: it comes from `electron-to-chromium`, which is published
 * with every Electron release.
 *
 * ⚠️ This table must be extended for every new Electron major. A major newer
 * than the newest entry reuses that entry; a major older than the oldest entry
 * gets no targets at all, leaving Vite's defaults in place.
 */
const electronNodeVersions = [
  { electron: 41, node: '24.14' },
  { electron: 40, node: '24.11' },
  { electron: 39, node: '22.20' },
  { electron: 38, node: '22.19' },
  { electron: 37, node: '22.16' },
  { electron: 36, node: '22.14' },
  { electron: 35, node: '22.14' },
  { electron: 34, node: '20.18' },
  { electron: 33, node: '20.18' },
  { electron: 32, node: '20.16' },
  { electron: 31, node: '20.14' },
  { electron: 30, node: '20.11' },
  { electron: 29, node: '20.9' },
  { electron: 28, node: '18.18' },
] as const;

/** The Chromium major of the newest Electron release known to the mapping. */
const newestKnownChromium = Object.entries(versions).reduce(
  (newest, [electron, chromium]) => {
    const [major, minor] = electron.split('.').map(Number);
    return major > newest.major ||
      (major === newest.major && minor > newest.minor)
      ? { major, minor, chromium }
      : newest;
  },
  { major: -1, minor: -1, chromium: '' },
).chromium;

export type ElectronTargets = {
  /** Vite `build.target` for the main and preload bundles, e.g. `node22.20`. */
  node?: string;
  /** Vite `build.target` for the renderer bundles, e.g. `chrome142`. */
  chrome?: string;
};

function getChromeTarget(major: number, minor: number): string | undefined {
  // Electron releases newer than the installed mapping fall back to the newest
  // Chromium it knows about, the same way the Node.js table clamps.
  const chromium =
    electronToChromium(`${major}.${minor}`) ??
    electronToChromium(`${major}.0`) ??
    newestKnownChromium;

  return chromium ? `chrome${chromium}` : undefined;
}

/**
 * Maps an Electron version to the Vite build targets its Node.js and Chromium
 * runtimes support. Returns an empty object for versions that cannot be mapped.
 */
export function getElectronTargets(version: string): ElectronTargets {
  const match = /^v?(\d+)(?:\.(\d+))?/.exec(version);
  if (!match) {
    return {};
  }

  const major = Number(match[1]);
  const minor = Number(match[2] ?? 0);
  const entry = electronNodeVersions.find(({ electron }) => major >= electron);
  if (!entry) {
    return {};
  }

  return { node: `node${entry.node}`, chrome: getChromeTarget(major, minor) };
}

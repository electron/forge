import { electronToChromium, versions } from 'electron-to-chromium';

/**
 * The Node.js version that each Electron major ships, used to derive Vite's
 * `build.target` for the main process bundle so it is not downleveled for
 * engines Electron never runs. Each value is the version that major shipped in
 * its `X.0.0` release, checked against `electron/electron`'s `DEPS`.
 *
 * The table started as a port of electron-vite's (MIT © 2022 Alex Wei,
 * https://github.com/alex8088/electron-vite, `src/electron.ts`). Chromium is
 * not tabulated here: it comes from `electron-to-chromium`, which is published
 * with every Electron release.
 *
 * ⚠️ Add an entry for every new Electron major. Order does not matter, the
 * table is sorted below. A major newer than the newest entry reuses that
 * entry; a major older than the oldest entry gets no targets at all, leaving
 * Vite's defaults in place.
 */
const electronNodeVersions = [
  { electron: 44, node: '24.18' },
  { electron: 43, node: '24.17' },
  { electron: 42, node: '24.15' },
  { electron: 41, node: '24.14' },
  { electron: 40, node: '24.11' },
  { electron: 39, node: '22.20' },
  { electron: 38, node: '22.18' },
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
];

/** Newest major first, so the first entry at or below a version matches it. */
const nodeVersionsByNewest = [...electronNodeVersions].sort(
  (a, b) => b.electron - a.electron,
);

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
  /** Vite `build.target` for the main process bundle, e.g. `node22.20`. */
  node?: string;
  /** Vite `build.target` for the preload and renderer bundles, e.g. `chrome142`. */
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
  const entry = nodeVersionsByNewest.find(({ electron }) => major >= electron);
  if (!entry) {
    return {};
  }

  return { node: `node${entry.node}`, chrome: getChromeTarget(major, minor) };
}

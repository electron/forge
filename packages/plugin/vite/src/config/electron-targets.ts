/**
 * The Node.js and Chromium versions that each Electron major ships, used to
 * derive Vite's `build.target` so bundles are not downleveled for engines
 * Electron never runs.
 *
 * Ported from electron-vite
 * (https://github.com/alex8088/electron-vite, `src/electron.ts`).
 *
 * ⚠️ This table must be extended for every new Electron major. Majors newer
 * than the newest entry reuse the newest entry; majors older than the oldest
 * entry get no target at all, leaving Vite's default in place.
 */
const electronTargets = [
  { electron: 41, node: '24.14', chrome: '146' },
  { electron: 40, node: '24.14', chrome: '144' },
  { electron: 39, node: '22.20', chrome: '142' },
  { electron: 38, node: '22.19', chrome: '140' },
  { electron: 37, node: '22.16', chrome: '138' },
  { electron: 36, node: '22.14', chrome: '136' },
  { electron: 35, node: '22.14', chrome: '134' },
  { electron: 34, node: '20.18', chrome: '132' },
  { electron: 33, node: '20.18', chrome: '130' },
  { electron: 32, node: '20.16', chrome: '128' },
  { electron: 31, node: '20.14', chrome: '126' },
  { electron: 30, node: '20.11', chrome: '124' },
  { electron: 29, node: '20.9', chrome: '122' },
  { electron: 28, node: '18.18', chrome: '120' },
] as const;

export type ElectronTargets = {
  /** Vite `build.target` for the main and preload bundles, e.g. `node22.20`. */
  node?: string;
  /** Vite `build.target` for the renderer bundles, e.g. `chrome142`. */
  chrome?: string;
};

/**
 * Maps an Electron version to the Vite build targets its Node.js and Chromium
 * runtimes support. Returns an empty object for versions that cannot be mapped.
 */
export function getElectronTargets(version: string): ElectronTargets {
  const major = Number.parseInt(version.replace(/^v/, ''), 10);
  if (!Number.isInteger(major)) {
    return {};
  }

  const [newest] = electronTargets;
  const entry =
    major >= newest.electron
      ? newest
      : electronTargets.find(({ electron }) => electron === major);
  if (!entry) {
    return {};
  }

  return { node: `node${entry.node}`, chrome: `chrome${entry.chrome}` };
}

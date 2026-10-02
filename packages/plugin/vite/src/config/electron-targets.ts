// Node.js and Chromium versions shipped in each Electron major's X.0.0 release.
// Add a row for every new Electron major.
const electronVersions = [
  { electron: 44, node: '24.18', chrome: '152' },
  { electron: 43, node: '24.17', chrome: '150' },
  { electron: 42, node: '24.15', chrome: '148' },
  { electron: 41, node: '24.14', chrome: '146' },
  { electron: 40, node: '24.11', chrome: '144' },
  { electron: 39, node: '22.20', chrome: '142' },
  { electron: 38, node: '22.18', chrome: '140' },
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
].sort((a, b) => b.electron - a.electron);

export type ElectronTargets = {
  node?: string;
  chrome?: string;
};

export function getElectronTargets(version: string): ElectronTargets {
  const major = Number.parseInt(version.replace(/^v/, ''), 10);
  const entry = electronVersions.find(({ electron }) => major >= electron);
  if (!entry) {
    return {};
  }

  return { node: `node${entry.node}`, chrome: `chrome${entry.chrome}` };
}

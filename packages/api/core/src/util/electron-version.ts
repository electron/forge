import debug from 'debug';

const d = debug('electron-forge:electron-version');

const electronPackageNames = [
  'electron-prebuilt-compile',
  'electron-prebuilt',
  'electron-nightly',
  'electron',
];

function findElectronDep(dep: string): boolean {
  return electronPackageNames.includes(dep);
}

export function getElectronVersion(packageJSON: any) {
  if (!packageJSON.devDependencies) {
    throw new Error('package.json for app does not have any devDependencies'.red);
  }
  const packageName = electronPackageNames.find(pkg => packageJSON.devDependencies[pkg]);
  if (packageName === undefined) {
    throw new Error('Could not find any Electron packages in devDependencies');
  }
  return packageJSON.devDependencies[packageName];
}

export function updateElectronDependency(
  packageJSON: any,
  dev: string[],
  exact: string[],
): [string[], string[]] {
  const alteredDev = ([] as string[]).concat(dev);
  let alteredExact = ([] as string[]).concat(exact);
  if (Object.keys(packageJSON.devDependencies).find(findElectronDep)) {
    alteredExact = alteredExact.filter(dep => dep !== 'electron');
  } else {
    const electronKey = Object.keys(packageJSON.dependencies).find(findElectronDep);
    if (electronKey) {
      alteredExact = alteredExact.filter(dep => dep !== 'electron');
      d(`Moving ${electronKey} from dependencies to devDependencies`);
      alteredDev.push(`${electronKey}@${packageJSON.dependencies[electronKey]}`);
      delete packageJSON.dependencies[electronKey];
    }
  }

  return [alteredDev, alteredExact];
}

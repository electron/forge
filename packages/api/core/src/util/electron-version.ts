import debug from 'debug';

const d = debug('electron-forge:electron-version');

const electronPackageNames = [
  'electron-prebuilt-compile',
  'electron-prebuilt',
  'electron',
];

function findElectronDep(dep: string): boolean {
  return electronPackageNames.includes(dep);
}

export function getElectronVersion (packageJSON: any) {
  if (!packageJSON.devDependencies) {
    throw new Error('package.json for app does not have any devDependencies'.red);
  }
  const packageName = electronPackageNames.find(pkg => packageJSON.devDependencies[pkg]);
  if (packageName === undefined) {
    throw new Error('Could not find any Electron packages in devDependencies');
  }
  return packageJSON.devDependencies[packageName];
};

export function updateElectronDependency(packageJSON: any, dev: string[], exact: string[]): [string[], string[]] {
  if (Object.keys(packageJSON.devDependencies).find(findElectronDep)) {
    exact = exact.filter(dep => dep !== 'electron');
  } else {
    const electronKey = Object.keys(packageJSON.dependencies).find(findElectronDep);
    if (electronKey) {
      exact = exact.filter(dep => dep !== 'electron');
      d(`Moving ${electronKey} from dependencies to devDependencies`);
      dev.push(`${electronKey}@${packageJSON.dependencies[electronKey]}`);
      delete packageJSON.dependencies[electronKey];
    }
  }

  return [dev, exact];
}

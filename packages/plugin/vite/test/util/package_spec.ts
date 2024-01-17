import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

import { expect } from 'chai';

import { getFlatDependencies, isDirectory, lookupNodeModulesPaths, resolveDependencies } from '../../src/util/package';

const execPromise = promisify(exec);
const packageRoot = path.join(__dirname, '../fixture/package');
const depsTree = [
  {
    name: 'electron-squirrel-startup',
    path: {
      src: path.join(packageRoot, 'node_modules', 'electron-squirrel-startup'),
      dest: path.join('node_modules', 'electron-squirrel-startup'),
    },
    dependencies: [
      {
        name: 'debug',
        path: {
          src: path.join(packageRoot, 'node_modules', 'debug'),
          dest: path.join('node_modules', 'debug'),
        },
        dependencies: [
          {
            name: 'ms',
            path: {
              src: path.join(packageRoot, 'node_modules', 'ms'),
              dest: path.join('node_modules', 'ms'),
            },
            dependencies: [],
          },
        ],
      },
    ],
  },
];
const depsFlat = [
  {
    src: path.join(packageRoot, 'node_modules', 'electron-squirrel-startup'),
    dest: path.join('node_modules', 'electron-squirrel-startup'),
  },
  {
    src: path.join(packageRoot, 'node_modules', 'debug'),
    dest: path.join('node_modules', 'debug'),
  },
  {
    src: path.join(packageRoot, 'node_modules', 'ms'),
    dest: path.join('node_modules', 'ms'),
  },
];

describe('util/package', () => {
  before(async () => {
    await execPromise('npm install', { cwd: packageRoot });
  });

  it('dependencies of package.json is resolved correct', async () => {
    const depsT = await resolveDependencies(packageRoot);
    const depsF = await getFlatDependencies(packageRoot);
    expect(depsTree).deep.equal(depsT);
    expect(depsFlat).deep.equal(depsF);
  });

  it('isDirectory check is correct', async () => {
    expect(await isDirectory(packageRoot)).true;
    expect(await isDirectory(path.join(packageRoot, 'package.json'))).false;
  });

  it('node_modules paths is lookup correct', async () => {
    const paths = await lookupNodeModulesPaths(packageRoot);
    expect(paths.length).gt(0);
  });
});

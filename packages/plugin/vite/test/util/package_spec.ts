import { exec } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

import { expect } from 'chai';

import { getFlatDependencies } from '../../src/util/package';

const execPromise = promisify(exec);
const packageRoot = path.join(__dirname, '../fixture/package');
const proDeps = ['electron-squirrel-startup', 'debug', 'ms'];

describe('util/package', () => {
  before(async () => {
    await execPromise('npm install', { cwd: packageRoot });
  });

  it('dependencies of package.json is resolved correct', async () => {
    const flatDeps = await getFlatDependencies(packageRoot);
    expect(proDeps).deep.equal(flatDeps.map((dep) => dep.name));
  });
});

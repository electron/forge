import { expect } from 'chai';
import path from 'path';
import { getElectronVersion, updateElectronDependency } from '../../src/util/electron-version';
import { devDeps, exactDevDeps } from '../../src/api/init-scripts/init-npm';

describe('updateElectronDependency', () => {
  it('adds an Electron dep if one does not already exist', () => {
    const packageJSON = { dependencies: {}, devDependencies: {} };
    const [dev, exact] = updateElectronDependency(packageJSON, devDeps, exactDevDeps);
    expect(dev).to.deep.equal(devDeps);
    expect(exact).to.deep.equal(exactDevDeps);
  });
  it('does not add an Electron dep if one already exists', () => {
    const packageJSON = {
      dependencies: {},
      devDependencies: { electron: '0.37.0' },
    };
    const [dev, exact] = updateElectronDependency(packageJSON, devDeps, exactDevDeps);
    expect(dev).to.deep.equal(devDeps);
    expect(exact).to.deep.equal([]);
  });
  it('moves an Electron dependency from dependencies to devDependencies', () => {
    const packageJSON = {
      dependencies: { electron: '0.37.0' },
      devDependencies: { },
    };
    const [dev, exact] = updateElectronDependency(packageJSON, devDeps, exactDevDeps);
    expect(dev.includes('electron@0.37.0')).to.equal(true);
    expect(exact).to.deep.equal([]);
  });
});

describe('getElectronVersion', () => {
  it('fails without devDependencies', () => expect(getElectronVersion('', {})).to.eventually.be.rejectedWith('does not have any devDependencies'));

  it('fails without electron devDependencies', () => expect(getElectronVersion('', { devDependencies: {} })).to.eventually.be.rejectedWith('Electron packages in devDependencies'));

  it('fails with a non-exact version and no electron installed', () => {
    const fixtureDir = path.resolve(__dirname, '..', 'fixture', 'dummy_app');
    return expect(getElectronVersion(fixtureDir, { devDependencies: { electron: '^4.0.2' } })).to.eventually.be.rejectedWith('Cannot find the package');
  });

  it('works with a non-exact version with electron installed', () => {
    const fixtureDir = path.resolve(__dirname, '..', 'fixture', 'non-exact');
    return expect(getElectronVersion(fixtureDir, { devDependencies: { electron: '^4.0.2' } })).to.eventually.equal('4.0.9');
  });

  it('works with electron-prebuilt-compile', () => {
    const packageJSON = {
      devDependencies: { 'electron-prebuilt-compile': '1.0.0' },
    };
    return expect(getElectronVersion('', packageJSON)).to.eventually.equal('1.0.0');
  });

  it('works with electron-prebuilt', async () => {
    const packageJSON = {
      devDependencies: { 'electron-prebuilt': '1.0.0' },
    };
    return expect(await getElectronVersion('', packageJSON)).to.be.equal('1.0.0');
  });

  it('works with electron-nightly', async () => {
    const packageJSON = {
      devDependencies: { 'electron-nightly': '5.0.0-nightly.20190107' },
    };
    return expect(await getElectronVersion('', packageJSON)).to.be.equal('5.0.0-nightly.20190107');
  });

  it('works with electron', async () => {
    const packageJSON = {
      devDependencies: { electron: '1.0.0' },
    };
    return expect(await getElectronVersion('', packageJSON)).to.be.equal('1.0.0');
  });

  it('works with a non-exact version and yarn workspaces', async () => {
    const fixtureDir = path.resolve(__dirname, '..', 'fixture', 'yarn-workspace', 'packages', 'subpackage');
    const packageJSON = {
      devDependencies: { electron: '^4.0.4' },
    };
    return expect(await getElectronVersion(fixtureDir, packageJSON)).to.be.equal('4.0.9');
  });
});

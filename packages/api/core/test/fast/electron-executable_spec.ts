import path from 'path';

import chai, { expect } from 'chai';
import { createSandbox } from 'sinon';
import sinonChai from 'sinon-chai';

import locateElectronExecutable, { pluginCompileExists } from '../../src/util/electron-executable';

chai.use(sinonChai);

const fixtureDir = path.resolve(__dirname, '..', 'fixture', 'electron-executable');

describe('locateElectronExecutable', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.spy(console, 'warn');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('returns the correct path to electron', async () => {
    const appFixture = path.join(fixtureDir, 'electron_app');
    const packageJSON = {
      devDependencies: { electron: '^100.0.0' },
    };

    await expect(locateElectronExecutable(appFixture, packageJSON)).to.eventually.equal('execPath');
    expect(console.warn).to.not.have.been.called;
  });

  it('warns and returns a hardcoded path to electron if another electron module does not export a string', async () => {
    const appFixture = path.join(fixtureDir, 'bad-export');
    const packageJSON = {
      devDependencies: {
        '@electron-forge/plugin-compile': '^6.0.0-beta.1',
        'electron-prebuilt-compile': '^1.4.0',
      },
    };

    await expect(locateElectronExecutable(appFixture, packageJSON)).to.eventually.equal('execPath');
    expect(console.warn).to.have.been.calledOnce;
  });

  it('warns if prebuilt-compile exists without the corresponding plugin', async () => {
    const packageJSON = {
      devDependencies: { 'electron-prebuilt-compile': '1.0.0' },
    };
    const compileFixture = path.join(fixtureDir, 'prebuilt-compile');

    await expect(locateElectronExecutable(compileFixture, packageJSON)).to.eventually.be.rejected;
    expect(console.warn).to.have.been.calledOnce;
  });

  it('does not warn if prebuilt-compile exists with the corresponding plugin', async () => {
    const packageJSON = {
      devDependencies: {
        '@electron-forge/plugin-compile': '^6.0.0-beta.1',
        'electron-prebuilt-compile': '1.0.0',
      },
    };

    const compileFixture = path.join(fixtureDir, 'prebuilt-compile');
    await expect(locateElectronExecutable(compileFixture, packageJSON)).to.eventually.be.rejected;
    expect(console.warn).to.not.have.been.called;
  });
});

describe('pluginCompileExists', () => {
  const sandbox = createSandbox();

  beforeEach(() => {
    sandbox.spy(console, 'warn');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('returns false if there is no devDependencies', () => {
    expect(pluginCompileExists({})).to.equal(false);
  });

  it('returns false if the plugin is not found in devDependencies', () => {
    expect(pluginCompileExists({ devDependencies: {} })).to.equal(false);
  });

  it('returns true if the plugin is found in devDependencies', () => {
    const packageJSON = {
      devDependencies: { '@electron-forge/plugin-compile': '^6.0.0-beta.1' },
    };

    expect(pluginCompileExists(packageJSON)).to.equal(true);
    expect(console.warn).to.not.have.been.called;
  });

  it('warns and returns true if the plugin is found in dependencies', () => {
    const packageJSON = {
      dependencies: { '@electron-forge/plugin-compile': '^6.0.0-beta.1' },
      devDependencies: {},
    };

    expect(pluginCompileExists(packageJSON)).to.equal(true);
    expect(console.warn).to.have.been.calledOnce;
  });
});

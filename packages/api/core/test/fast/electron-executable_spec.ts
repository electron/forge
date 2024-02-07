import path from 'path';

import chai, { expect } from 'chai';
import { createSandbox } from 'sinon';
import sinonChai from 'sinon-chai';

import locateElectronExecutable from '../../src/util/electron-executable';

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
});

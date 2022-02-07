import { expect } from 'chai';

import Installer, { InstallerOptions } from '../src/Installer';

class InstallerImpl extends Installer {
  name = 'test';
}

describe('Installer', () => {
  it('should define __isElectronForgeInstaller', () => {
    const installer = new InstallerImpl();
    expect(installer).to.have.property('__isElectronForgeInstaller', true);
    expect(installer.name).to.equal('test');
  });

  it('should throw an error when install is called', async () => {
    const installer = new InstallerImpl();
    await expect(installer.install({} as InstallerOptions)).to.eventually.be.rejected;
  });
});

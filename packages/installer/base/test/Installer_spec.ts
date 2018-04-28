import { expect } from 'chai';

import Installer from '../src/Installer';

class InstallerImpl extends Installer {
  name = 'test';
}

describe('Installer', () => {
  it('should define __isElectronForgeInstaller', () => {
    const installer = new InstallerImpl();
    expect(installer).to.have.property('__isElectronForgeInstaller', true);
    expect(installer.name).to.equal('test');
  });

  it('should throw an error when install is called', (done) => {
    const installer = new InstallerImpl();
    installer.install({} as any).catch(() => done());
  });
});

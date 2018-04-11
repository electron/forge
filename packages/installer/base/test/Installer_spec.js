import { expect } from 'chai';

import Installer from '../src/Installer';

describe('Installer', () => {
  it('should define __isElectronForgeInstaller', () => {
    const installer = new Installer('test');
    expect(installer).to.have.property('__isElectronForgeInstaller', true);
  });

  it('should throw an error when install is called', (done) => {
    const installer = new Installer('test');
    installer.install({}).catch(() => done());
  });
});

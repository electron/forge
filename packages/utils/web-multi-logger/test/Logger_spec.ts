import { expect } from 'chai';

import Logger from '../src/Logger';
import Tab from '../src/Tab';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
  });

  it('should create a tab', () => {
    const tabName = 'Test Tab';
    const tab = logger.createTab(tabName);
    expect(tab).to.be.an.instanceOf(Tab);
    expect(tab.name).to.equal(tabName);
  });

  it('should start the server', async () => {
    const port = await logger.start(); // This will test the findAvailablePort method
    expect(port).to.be.a('number');
  });

  it('should stop the server', () => {
    logger.stop();
  });
});

import { expect } from 'chai';

import { findAvailablePort, portOccupied } from '../src/port';
describe('Port tests', () => {
  describe('portOccupied', () => {
    it('should resolve to true if the port is available', async () => {
      const port = 49152;
      const result = await portOccupied(port);
      expect(result).to.not.throw;
    });

    it('should reject if the port is occupied', async () => {
      const port = 3000;
      try {
        await portOccupied(port);
      } catch (error) {
        expect((error as Error).message).to.equal(`port: ${port} is occupied`);
      }
    });
  });

  describe('findAvailablePort', () => {
    it('should find an available port', async () => {
      const initialPort = 49152;
      const port = await findAvailablePort(initialPort);
      expect(port).to.be.a('number');
      expect(port).to.be.within(initialPort, initialPort + 10);
    });

    it('should throw an error if no available port is found', async () => {
      const initialPort = 3000;
      try {
        await findAvailablePort(initialPort);
      } catch (error) {
        expect((error as Error).message).to.equal(
          `Could not find an available port between ${initialPort} and ${initialPort + 10}. Please free up a port and try again.`
        );
      }
    });
  });
});

import { expect } from 'chai';
import { stub } from 'sinon';

import { findAvailablePort } from '../src/port';

describe('Port tests', () => {
  describe('Find available port', () => {
    it('should find an available port', async () => {
      const initialPort = 9000;
      // reject initial port, accept 9001
      const portOccupiedStub = stub();
      portOccupiedStub.onFirstCall().throws(new Error('port: 9000 is occupied'));
      portOccupiedStub.onSecondCall().returns(Promise.resolve());

      const port = await findAvailablePort(initialPort, portOccupiedStub);
      expect(port).to.equal(9001);
      expect(portOccupiedStub.callCount).to.equal(2);
      expect(portOccupiedStub.firstCall.args[0]).to.equal(9000);
      expect(portOccupiedStub.secondCall.args[0]).to.equal(9001);
    });
    it('should throw an error if no port is available', async () => {
      const initialPort = 9000;
      const portOccupiedStub = stub();
      for (let i = 0; i < 11; i++) {
        portOccupiedStub.onCall(i).throws(new Error('port: ' + (9000 + i) + ' is occupied'));
      }
      try {
        await findAvailablePort(initialPort, portOccupiedStub);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect((err as Error).message).to.equal('Could not find an available port between 9000 and 9010. Please free up a port and try again.');
      }
    });
  });
});

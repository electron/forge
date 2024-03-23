import net from 'node:net';

import { expect } from 'chai';

import { findAvailablePort, portOccupied } from '../src/port';

const usePort = (port: number) => {
  const server = net.createServer();
  server.on('error', () => {
    // pass
  });
  server.listen(port);
  return () => {
    server.close();
  };
};

const usePorts = (port: number, endPort: number) => {
  const releases: ReturnType<typeof usePort>[] = [];
  for (let i = port; i <= endPort; i++) {
    releases.push(usePort(i));
  }
  return () => {
    releases.forEach((release) => release());
  };
};

describe('Port tests', () => {
  describe('portOccupied', () => {
    it('should resolve to true if the port is available', async () => {
      const port = 49152;
      const result = await portOccupied(port);
      expect(result).to.not.throw;
    });
    it('should reject if the port is occupied', async () => {
      const port = 48143;
      const releasePort = usePort(port);
      try {
        await portOccupied(port);
      } catch (error) {
        expect((error as Error).message).to.equal(`port: ${port} is occupied`);
      } finally {
        releasePort();
      }
    });
  });

  describe('findAvailablePort', () => {
    it('should find an available port', async () => {
      const initialPort = 51155;
      const port = await findAvailablePort(initialPort);
      expect(port).gte(initialPort);
    });
    it('should throw an error if no available port is found', async () => {
      const initialPort = 53024;
      const releasePort = usePorts(initialPort, initialPort + 10);
      try {
        await findAvailablePort(initialPort);
      } catch (error) {
        expect((error as Error).message).to.equal(
          `Could not find an available port between ${initialPort} and ${initialPort + 10}. Please free up a port and try again.`
        );
      } finally {
        releasePort();
      }
    });
  });
});

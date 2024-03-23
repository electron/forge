import http from 'http';

/**
 * Check if a port is occupied.
 * @returns boolean promise that resolves to true if the port is available, false otherwise.
 */
export const portOccupied = async (port: number): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const server = http.createServer().listen(port);
    server.on('listening', () => {
      server.close();
      resolve();
    });

    server.on('error', (error) => {
      if ('code' in error && (error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
        reject(new Error(`port: ${port} is occupied`));
      } else {
        reject(error);
      }
    });
  });
};

/**
 * Find an available port for web UI.
 * @returns the port number.
 */
export const findAvailablePort = async (initialPort: number): Promise<number> => {
  const maxPort = initialPort + 10;

  for (let p = initialPort; p <= maxPort; p++) {
    try {
      await portOccupied(p);
      return p;
    } catch (_err) {
      // Pass
    }
  }
  throw new Error(`Could not find an available port between ${initialPort} and ${maxPort}. Please free up a port and try again.`);
};

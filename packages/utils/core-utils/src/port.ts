import http from 'http';

/**
 * Check if a port is occupied.
 * @returns boolean promise that resolves to true if the port is occupied, false otherwise.
 */
export const portOccupied = async (port: number): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    const server = http.createServer().listen(port);
    server.on('listening', () => {
      server.close();
      server.on('close', () => {
        resolve(false);
      });
    });

    server.on('error', () => {
      resolve(true);
    });
  });
};

/**
 * Find an available port for web UI.
 * @returns the port number.
 */
export const findAvailablePort = async (
  initialPort: number,
): Promise<number> => {
  const maxPort = initialPort + 10;

  for (let p = initialPort; p <= maxPort; p++) {
    if (!(await portOccupied(p))) {
      return p;
    }
  }
  throw new Error(
    `Could not find an available port between ${initialPort} and ${maxPort}. Please free up a port and try again.`,
  );
};

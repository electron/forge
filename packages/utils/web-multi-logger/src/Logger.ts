import http from 'http';
import path from 'path';

import express from 'express';
import ews from 'express-ws';

import Tab from './Tab';

export { Tab };

export default class Logger {
  private app = express();

  private ws!: ews.Instance;

  private tabs: Tab[] = [];

  private server: http.Server | null = null;

  constructor(private port = 9000) {
    this.registerRoutes();
  }

  private registerRoutes() {
    this.ws = ews(this.app);
    this.app.get('/rest/tabs', (_req, res) => res.json(this.tabs));

    this.app.use('/xterm/addons/fit', express.static(path.dirname(require.resolve('xterm-addon-fit'))));
    this.app.use('/xterm/addons/search', express.static(path.dirname(require.resolve('xterm-addon-search'))));
    this.app.use('/xterm', express.static(path.resolve(require.resolve('xterm'), '../..')));
    this.app.use(express.static(path.resolve(__dirname, '..', 'static')));
    this.ws.app.ws('/sub', () => {
      // I assume this endpoint is just a no-op needed for some reason.
    });
  }
  /**
   * Check if a port is occupied.
   * @returns boolean promise that resolves to true if the port is available, false otherwise.
   */
  private static async portOccupied(port: number): Promise<void> {
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
  }
  /**
   * Find an available port for web UI.
   * @returns the port number.
   */
  private static async findAvailablePort(initialPort: number): Promise<number> {
    const maxPort = initialPort + 10;

    for (let p = initialPort; p <= maxPort; p++) {
      try {
        await Logger.portOccupied(p);
        return p;
      } catch (_err) {
        // Pass
      }
    }
    throw new Error(`Could not find an available port between ${initialPort} and ${maxPort}. Please free up a port and try again.`);
  }

  /**
   * Creates a new tab with the given name, the name should be human readable
   * it will be used as the tab title in the front end.
   */
  createTab(name: string): Tab {
    const tab = new Tab(name, this.ws);
    this.tabs.push(tab);
    return tab;
  }

  /**
   * Start the HTTP server hosting the web UI.
   *
   * @returns the port number
   */
  async start(): Promise<number> {
    this.port = await Logger.findAvailablePort(this.port);
    this.server = this.app.listen(this.port);
    return this.port;
  }
  /**
   * Stop the HTTP server hosting the web UI
   */
  stop(): void {
    if (this.server) this.server.close();
  }
}

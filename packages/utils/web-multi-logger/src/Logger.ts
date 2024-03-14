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
   * Find an available port between 9000 and 9009 for web UI.
   * @returns the port number.
   */
  private async findAvailablePort(): Promise<number> {
    const maxPortAttempts = 10; // Maximum attempts to find an available port
    let port = this.port;
    let attempts = 0;

    while (attempts < maxPortAttempts) {
      try {
        await new Promise<void>((resolve, reject) => {
          const server = http.createServer();
          server.unref(); // Allows the program to exit if this is the only active server
          server.on('error', reject);
          server.listen(port, () => {
            server.close(() => {
              resolve();
            });
          });
        });
        return port;
      } catch {
        // Port is in use, try the next one
        port++;
        attempts++;
      }
    }
    throw new Error('Could not find an available port between 9000 and 9009. Please free up a port and try again.');
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
    this.port = await this.findAvailablePort();
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

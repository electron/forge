import express from 'express';
import path from 'path';
import ews from 'express-ws';
import http from 'http';

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
    this.app.get('/rest/tabs', (req, res) => res.json(this.tabs));

    this.app.use('/xterm', express.static(path.resolve(require.resolve('xterm'), '../../../dist')));
    this.app.use(express.static(path.resolve(__dirname, '..', 'static')));
    (this.app as any).ws('/sub', () => {});
  }

  /**
   * Creates a new tab with the given name, the name should be human readable
   * it will be used as the tab title in the front end.
   */
  createTab(name: string) {
    const tab = new Tab(name, this.ws);
    this.tabs.push(tab);
    return tab;
  }

  /**
   * Start the HTTP server hosting the web UI
   */
  start() {
    return new Promise<number>((resolve) => {
      this.server = this.app.listen(this.port, () => resolve(this.port));
    });
  }

  /**
   * Stop the HTTP server hosting the web UI
   */
  stop() {
    if (this.server) this.server.close();
  }
}

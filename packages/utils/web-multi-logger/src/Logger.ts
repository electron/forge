import express from 'express';
import path from 'path';
import ews from 'express-ws';
import http from 'http';

import Tab from './Tab';

export default class Logger {
  private app = express();
  private ws!: ews.Instance;
  private tabs: Tab[] = [];
  private server: http.Server | null = null;

  constructor(private port = 9000) {
    this.registerRoutes();
  }

  registerRoutes() {
    this.ws = ews(this.app);
    this.app.get('/rest/tabs', (req, res) => {
      return res.json(this.tabs);
    });

    this.app.use('/xterm', express.static(path.resolve(__dirname, '..', 'node_modules', 'xterm', 'dist')));
    this.app.use(express.static(path.resolve(__dirname, '..', 'static')));
    (this.app as any).ws('/sub', () => {});
  }

  createTab(name: string) {
    const tab = new Tab(name, this.ws);
    this.tabs.push(tab);
    return tab;
  }

  start() {
    return new Promise<number>((resolve) => {
      this.server = this.app.listen(this.port, () => resolve(this.port));
    });
  }

  stop() {
    if (this.server) this.server.close();
  }
}

import ews from 'express-ws';

import Log from './Log';

let idCounter = 1;

export default class Tab {
  private logs: Log[] = [];

  private id: number;

  constructor(public name: string, private ws: ews.Instance) {
    this.id = idCounter;
    idCounter += 1;
  }

  /**
   * Log a line to the web UI, a new line is automatically appended to the line
   */
  log(line: string): void {
    const log = new Log(line, new Date());
    this.logs.push(log);

    for (const client of this.ws.getWss().clients) {
      client.send(
        JSON.stringify({
          tab: this.id,
          payload: log,
        })
      );
    }
  }

  private toJSON() {
    return {
      id: this.id,
      name: this.name,
      logs: this.logs,
    };
  }
}

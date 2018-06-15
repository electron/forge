import 'colors';
import PluginBase from '@electron-forge/plugin-base';
import Logger from '@electron-forge/web-multi-logger';
import Tab from '@electron-forge/web-multi-logger/dist/Tab';
import { ChildProcess } from 'child_process';
import debug from 'debug';
import path from 'path';
import http from 'http';

const d = debug('electron-forge:plugin:bundler-base');

export class BundlerWatchWrapper<BundlerWatchType> {
  constructor(public watch: BundlerWatchType, public stopper: (watch: BundlerWatchType, cb?: () => void) => void) {}

  public stop(cb?: () => void) {
    return this.stopper(this.watch, cb);
  }
}

export default abstract class BundlerBasePlugin<C, BundlerConfigType, BundlerWatchType> extends PluginBase<C> {
  protected isProd = false;
  protected baseDir!: string;
  protected watchers: BundlerWatchWrapper<BundlerWatchType>[] = [];
  protected servers: http.Server[] = [];
  protected loggers: Logger[] = [];

  constructor(c: C) {
    super(c);

    this.startLogic = this.startLogic.bind(this);
    this.getHook = this.getHook.bind(this);
  }

  protected resolveConfig = (config: BundlerConfigType | string) => {
    if (typeof config === 'string') return require(path.resolve(path.dirname(this.baseDir), config)) as BundlerConfigType;
    return config;
  }

  protected exitHandler = (options: { cleanup?: boolean; exit?: boolean }, err?: Error) => {
    d('handling process exit with:', options);
    if (options.cleanup) {
      for (const watcher of this.watchers) {
        d('cleaning webpack watcher');
        watcher.stop(() => {});
      }
      this.watchers = [];
      for (const server of this.servers) {
        d('cleaning http server');
        server.close();
      }
      this.servers = [];
      for (const logger of this.loggers) {
        d('stopping logger');
        logger.stop();
      }
      this.loggers = [];
    }
    if (err) console.error(err.stack);
    if (options.exit) process.exit();
  }

  init = (dir: string) => {
    this.baseDir = path.resolve(dir, '.bundles');

    d('hooking process events');
    process.on('exit', this.exitHandler.bind(this, { cleanup: true }));
    process.on('SIGINT', this.exitHandler.bind(this, { exit: true }));
  }

  private loggedOutputUrl = false;

  public getHook(name: string) {
    switch (name) {
      case 'prePackage':
        this.isProd = true;
        return async () => {
          await this.compileMain();
          await this.compileRenderers();
        };
      case 'postStart':
        return async (_: any, child: ChildProcess) => {
          if (!this.loggedOutputUrl) {
            console.info(`\n\n${this.name} Output Available: ${'http://localhost:9000'.cyan}\n`);
            this.loggedOutputUrl = true;
          }
          d('hooking electron process exit');
          child.on('exit', () => {
            if ((child as any).restarted) return;
            this.exitHandler({ cleanup: true, exit: true });
          });
        };
    }
    return null;
  }

  abstract compileMain: (watch?: boolean, logger?: Logger) => Promise<void>;

  abstract compileRenderers: () => Promise<void>;

  abstract launchDevServers: (logger: Logger) => Promise<void>;

  private alreadyStarted = false;

  async startLogic(): Promise<false> {
    if (this.alreadyStarted) return false;
    this.alreadyStarted = true;

    const logger = new Logger();
    this.loggers.push(logger);
    await this.compileMain(true, logger);
    await this.launchDevServers(logger);
    await logger.start();
    return false;
  }
}

import { asyncOra } from '@electron-forge/async-ora';
import { Tab } from '@electron-forge/web-multi-logger';
import { Compiler } from 'webpack';
import once from './once';

const pluginName = 'ElectronForgeLogging';

export default class LoggingPlugin {
  tab: Tab;

  promiseResolver: (() => void) | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  promiseRejector: ((reason?: any) => void) | undefined;

  constructor(tab: Tab) {
    this.tab = tab;
    this.promiseResolver = undefined;
    this.promiseRejector = undefined;
  }

  private addRun() {
    if (this.promiseResolver) this.promiseResolver();
    asyncOra(
      'Compiling Renderer Code',
      () =>
        new Promise<void>((resolve, reject) => {
          const [onceResolve, onceReject] = once(resolve, reject);
          this.promiseResolver = onceResolve;
          this.promiseRejector = onceReject;
        }),
      () => {
        /* do not exit */
      }
    );
  }

  private finishRun(error?: string) {
    if (error && this.promiseRejector) this.promiseRejector(error);
    else if (this.promiseResolver) this.promiseResolver();
    this.promiseRejector = undefined;
    this.promiseResolver = undefined;
  }

  apply(compiler: Compiler): void {
    compiler.hooks.watchRun.tap(pluginName, (_compiler) => {
      this.addRun();
    });
    compiler.hooks.done.tap(pluginName, (stats) => {
      if (stats) {
        this.tab.log(
          stats.toString({
            colors: true,
          })
        );
        if (stats.hasErrors()) {
          this.finishRun(stats.compilation.getErrors().toString());
          return;
        }
      }
      this.finishRun();
    });
    compiler.hooks.failed.tap(pluginName, (err) => this.finishRun(err.message));
    compiler.hooks.infrastructureLog.tap(pluginName, (name: string, _type: string, args: string[]) => {
      this.tab.log(`${name} - ${args.join(' ')}\n`);
      return true;
    });
  }
}

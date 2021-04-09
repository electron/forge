import { Tab } from '@electron-forge/web-multi-logger';
import { Compiler } from 'webpack';

const pluginName = 'ElectronForgeLogging';

export default class LoggingPlugin {
  tab: Tab;

  constructor(tab: Tab) {
    this.tab = tab;
  }

  apply(compiler: Compiler) {
    compiler.hooks.infrastructureLog.tap(
      pluginName,
      (name: string, _type: string, args: string[]) => {
        this.tab.log(`${name} - ${args.join(' ')}\n`);
        return true;
      },
    );
  }
}

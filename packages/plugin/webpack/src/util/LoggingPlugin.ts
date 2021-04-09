import Logger from '@electron-forge/web-multi-logger/src/Logger';
import { Compiler } from 'webpack';

const pluginName = 'ElectronForgeLogging';

export default class LoggingPlugin {
    logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    apply(compiler: Compiler) {
        compiler.hooks.infrastructureLog.tap(pluginName, (name: string, type: any, args: any) => {
            console.log("hook", name, type, args);
            // const tab = this.logger.createTab(`Renderer: ${name}`);
            // return {
            //     log: tab.log.bind(tab),
            // };
            return true;
        });
    }
}

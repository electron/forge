import { Tab, TabStatus } from '@electron-forge/multi-logger';
import { Compiler, Stats } from 'webpack';

const pluginName = 'ElectronForgeLogging';

/**
 * Summarises a finished compilation as a tab status.
 */
export function statusFromStats(stats: Stats): TabStatus {
  const durationMs =
    stats.startTime && stats.endTime
      ? stats.endTime - stats.startTime
      : undefined;
  if (stats.hasErrors()) {
    return {
      state: 'error',
      errors: Math.max(1, stats.compilation.errors.length),
      durationMs,
    };
  }
  if (stats.hasWarnings()) {
    return {
      state: 'warning',
      warnings: Math.max(1, stats.compilation.warnings.length),
      durationMs,
    };
  }
  return { state: 'success', durationMs };
}

/**
 * Routes a compiler's output and build state into a multi-logger tab.
 */
export default class LoggingPlugin {
  tab: Tab;

  constructor(tab: Tab) {
    this.tab = tab;
  }

  apply(compiler: Compiler): void {
    compiler.hooks.watchRun.tap(pluginName, () => {
      this.tab.setStatus({ state: 'building' });
    });
    compiler.hooks.done.tap(pluginName, (stats) => {
      if (stats) {
        this.tab.log(
          stats.toString({
            colors: true,
          }),
        );
        this.tab.setStatus(statusFromStats(stats));
      }
    });
    compiler.hooks.failed.tap(pluginName, (err) => {
      this.tab.log(err.message);
      this.tab.setStatus({ state: 'error', errors: 1 });
    });
    compiler.hooks.infrastructureLog.tap(pluginName, (name, _type, args) => {
      this.tab.log(`${name} - ${args?.join(' ')}\n`);
      return true;
    });
  }
}

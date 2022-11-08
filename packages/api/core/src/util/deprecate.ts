import chalk from 'chalk';
import logSymbols from 'log-symbols';

type Deprecation = {
  replaceWith: (replacement: string) => void;
};

export default (what: string): Deprecation => ({
  replaceWith: (replacement: string): void => {
    console.warn(logSymbols.warning, chalk.yellow(`WARNING: ${what} is deprecated, please use ${replacement} instead`));
  },
});

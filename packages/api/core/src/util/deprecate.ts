/* eslint "no-console": "off" */
import 'colors';
import logSymbols from 'log-symbols';

type Deprecation = {
  replaceWith: (replacement: string) => void;
};

export default (what: string): Deprecation => ({
  replaceWith: (replacement: string): void => {
    console.warn(logSymbols.warning, `WARNING: ${what} is deprecated, please use ${replacement} instead`.yellow);
  },
});

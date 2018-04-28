import 'colors';
import logSymbols from 'log-symbols';

export default (what: string) => ({
  replaceWith: (replacement: string) => {
    console.warn(logSymbols.warning, `WARNING: ${what} is deprecated, please use ${replacement} instead`.yellow);
  },
});

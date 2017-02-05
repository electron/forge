import 'colors';
import logSymbols from 'log-symbols';

export default what => ({
  replaceWith: (replacement) => {
    console.warn(logSymbols.warning, `WARNING: ${what} is deprecated, please use ${replacement} instead`.yellow);
  },
});

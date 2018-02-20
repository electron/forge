import colors from 'colors';
import ora from './ora';

class MockOra {
  succeed() { return this; }
  fail() { return this; }
  start() { return this; }
  stop() { return this; }
}

const asyncOra = (initialOraValue, asyncFn, processExitFn = process.exit) => {
  let fnOra = new MockOra();
  if (asyncOra.interactive) {
    fnOra = ora(initialOraValue).start();
  }
  return new Promise((resolve, reject) => {
    asyncFn(fnOra).then(() => {
      fnOra.succeed();
      resolve();
    }).catch((err) => {
      fnOra.fail();
      if (asyncOra.interactive) {
        if (err && err.message && err.stack) {
          console.error('\nAn unhandled error has occurred inside Forge:'.red);
          console.error(colors.red(err.message));
          console.error(colors.red(err.stack));
        } else {
          console.error('\nElectron forge was terminated:'.red);
          console.error(colors.red(typeof err === 'string' ? err : JSON.stringify(err)));
        }
        processExitFn(1);
        // If the process is still alive we should continue because either something went really wrong
        // or we are testing this function
        setTimeout(() => resolve(), 500);
      } else {
        reject(err);
      }
    });
  });
};

asyncOra.interactive = true;

export default asyncOra;

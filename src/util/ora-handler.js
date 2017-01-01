import colors from 'colors';
import ora from 'ora';

class MockOra {
  succeed() { return this; }
  fail() { return this; }
  start() { return this; }
  stop() { return this; }
}

const asyncOra = (initalOraValue, asyncFn) => {
  let fnOra = new MockOra();
  if (asyncOra.interactive) {
    fnOra = ora.ora(initalOraValue).start();
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
        process.exit(1);
      } else {
        reject(err);
      }
    });
  });
};

asyncOra.interactive = true;

export default asyncOra;

import colors from 'colors';
import ora from 'ora';

export default (initalOraValue, asyncFn) => {
  const fnOra = ora.ora(initalOraValue).start();
  return new Promise((resolve) => {
    asyncFn(fnOra).then(() => {
      fnOra.succeed();
      resolve();
    }).catch((err) => {
      fnOra.fail();
      if (err && err.message && err.stack) {
        console.error('\nAn unhandled error has occurred inside Forge:'.red);
        console.error(colors.red(err.message));
        console.error(colors.red(err.stack));
      } else {
        console.error('\nElectron forge was terminated:'.red);
        console.error(colors.red(typeof err === 'string' ? err : JSON.stringify(err)));
      }
      process.exit(1);
    });
  });
};

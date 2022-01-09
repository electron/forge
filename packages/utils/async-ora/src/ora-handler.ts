/* eslint "no-console": "off" */
import chalk from 'chalk';
import ora from './ora';

export class OraImpl {
  // eslint-disable-next-line no-empty-function, no-useless-constructor
  constructor(public text: string = '') {}

  succeed(_symbol?: string): OraImpl {
    return this;
  }

  fail(_symbol?: string): OraImpl {
    return this;
  }

  start(): OraImpl {
    return this;
  }

  stop(_symbol?: string): OraImpl {
    return this;
  }

  warn(_message: string): OraImpl {
    return this;
  }
}

export interface AsyncOraMethod {
  (initialOraValue: string, asyncFn: (oraImpl: OraImpl) => Promise<void>, processExitFn?: (code: number) => void): Promise<void>;
  interactive?: boolean;
}

const asyncOra: AsyncOraMethod = (initialOraValue, asyncFn, processExitFn = process.exit) => {
  let fnOra = new OraImpl(initialOraValue);
  if (asyncOra.interactive) {
    fnOra = ora(initialOraValue).start();
  }
  return new Promise((resolve, reject) => {
    asyncFn(fnOra)
      .then(() => {
        fnOra.succeed();
        return resolve();
      })
      .catch((err) => {
        fnOra.fail();
        if (asyncOra.interactive) {
          if (err && err.message && err.stack) {
            console.error(chalk.red('\nAn unhandled error has occurred inside Forge:'));
            console.error(chalk.red(err.message));
            console.error(chalk.red(err.stack));
          } else {
            console.error(chalk.red('\nElectron Forge was terminated:'));
            console.error(chalk.red(typeof err === 'string' ? err : JSON.stringify(err)));
          }
          processExitFn(1);
          // If the process is still alive we should continue because either
          // something went really wrong or we are testing this function
          setTimeout(() => resolve(), 500);
        } else {
          reject(err);
        }
      });
  });
};

asyncOra.interactive = true;

export default asyncOra;

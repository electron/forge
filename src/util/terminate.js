import colors from 'colors';
import debug from 'debug';
import ora from 'ora';

const d = debug('electron-forge:lifecycle');

const runningOras = {};

process.on('unhandledRejection', (err) => {
  Object.keys(runningOras).forEach(key => runningOras[key].fail());
  process.stdout.write('\n\nAn unhandled rejection has occurred inside Forge:\n');
  console.error(colors.red(err.stack || JSON.stringify(err)));
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  Object.keys(runningOras).forEach(key => runningOras[key].fail());
  process.stdout.write('\n\nAn unhandled exception has occurred inside Forge:\n');
  console.error(colors.red(err.stack || JSON.stringify(err)));
  process.exit(1);
});

if (process.env.DEBUG && process.env.DEBUG.includes('electron-forge')) {
  console.warn('WARNING: DEBUG environment variable detected.  Progress indicators will be sent over electron-forge:lifecycle'.red);
  ora.ora = (name) => {
    const fake = {
      start: () => {
        d('Process Started:', name);
        return fake;
      },
      fail: () => {
        d(`Process Failed: ${name}`.red);
        return fake;
      },
      succeed: () => {
        d('Process Succeeded:', name);
        return fake;
      },
      stop: () => {
        d('Process Stopped:', name);
        return fake;
      },
    };
    return fake;
  };
} else {
  let oraID = 1;
  ora.ora = (name) => {
    const createdOra = ora(name);
    createdOra.id = oraID;
    const fns = {};
    fns.start = createdOra.start.bind(createdOra);
    fns.stop = createdOra.stop.bind(createdOra);
    fns.succeed = createdOra.succeed.bind(createdOra);
    fns.fail = createdOra.fail.bind(createdOra);
    createdOra.start = () => {
      runningOras[createdOra.id] = createdOra;
      fns.start();
      return createdOra;
    };
    ['stop', 'succeed', 'fail'].forEach((fnName) => {
      createdOra[fnName] = (...args) => {
        delete runningOras[createdOra.id];
        fns[fnName](...args);
        return createdOra;
      };
    });
    oraID += 1;
    return createdOra;
  };
}

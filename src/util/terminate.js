import colors from 'colors';
import debug from 'debug';
import ora from 'ora';

const d = debug('electron-forge:lifecycle');

process.on('unhandledRejection', (err) => {
  if (err && err.message && err.stack) {
    console.error('\nAn unhandled rejection has occurred inside Forge:'.red);
    console.error(colors.red(err.message));
    console.error(colors.red(err.stack));
  } else {
    console.error('\nElectron forge was terminated:'.red);
    console.error(colors.red(typeof err === 'string' ? err : JSON.stringify(err)));
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  if (err && err.message && err.stack) {
    console.error('\nAn unhandled exception has occurred inside Forge:'.red);
    console.error(colors.red(err.message));
    console.error(colors.red(err.stack));
  } else {
    console.error('\nElectron forge was terminated:'.red);
    console.error(colors.red(typeof err === 'string' ? err : JSON.stringify(err)));
  }
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
  ora.ora = ora;
}

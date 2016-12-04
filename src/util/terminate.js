import colors from 'colors';
import debug from 'debug';
import ora from 'ora';

const d = debug('electron-forge:lifecycle');

process.on('unhandledRejection', (err) => {
  process.stdout.write('\n\nAn unhandled rejection has occurred inside Forge:\n');
  console.error(colors.red(err.stack));
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  process.stdout.write('\n\nAn unhandled exception has occurred inside Forge:\n');
  console.error(colors.red(err.stack));
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

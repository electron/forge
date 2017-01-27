import debug from 'debug';
import realOra from 'ora';

const d = debug('electron-forge:lifecycle');

const useFakeOra = (process.env.DEBUG && process.env.DEBUG.includes('electron-forge'));

if (useFakeOra) {
  console.warn('WARNING: DEBUG environment variable detected.  Progress indicators will be sent over electron-forge:lifecycle'.red);
}

export default useFakeOra ? (name) => {
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
} : realOra;

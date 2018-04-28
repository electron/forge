import 'colors';
import debug from 'debug';
import logSymbols from 'log-symbols';
import realOra from 'ora';
import { OraImpl } from './ora-handler';

const d = debug('electron-forge:async-ora');

const useFakeOra = Boolean(process.env.DEBUG && process.env.DEBUG.includes('electron-forge'));

if (useFakeOra) {
  console.warn('WARNING: DEBUG environment variable detected.  Progress indicators will be sent over electron-forge:lifecycle'.red);
}

export const fakeOra = (name: string) => {
  let _name = name;
  const fake: OraImpl = {
    start: () => {
      d('Process Started:', fake.text);
      return fake;
    },
    fail: () => {
      d(`Process Failed: ${fake.text}`.red);
      return fake;
    },
    succeed: () => {
      d('Process Succeeded:', fake.text);
      return fake;
    },
    stop: () => {
      d('Process Stopped:', fake.text);
      return fake;
    },
    warn: (warning: string) => {
      d('Process Warned:', warning);
      return fake;
    },
    get text() {
      return _name;
    },
    set text(newName: string) {
      d('Process Renamed:', _name, ' --> ', newName);
      _name = newName;
    },
  };
  return fake;
};

export default useFakeOra ? fakeOra : realOra;

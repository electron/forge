/* eslint "no-console": "off" */
import 'colors';
import debug from 'debug';
import 'log-symbols';
import realOra from 'ora';
import prettyMs from 'pretty-ms';

import { OraImpl } from './ora-handler';

const d = debug('electron-forge:async-ora');

const useFakeOra = Boolean(process.env.DEBUG && process.env.DEBUG.includes('electron-forge'));

if (useFakeOra) {
  console.warn('WARNING: DEBUG environment variable detected. Append the electron-forge:lifecycle namespace'.red);
  console.warn('to the value of DEBUG in order to view progress indicators.'.red);
}

export const fakeOra = (name: string): OraImpl => {
  let oraName = name;
  let startTime: number | null = null;
  const timing = () => (startTime ? `-- after ${`${prettyMs(Date.now() - startTime)}`.cyan}` : null);
  const fake: OraImpl = {
    start: () => {
      startTime = Date.now();
      d('Process Started:', fake.text);
      return fake;
    },
    fail: () => {
      d(`Process Failed: ${fake.text}`.red, timing());
      return fake;
    },
    succeed: () => {
      d('Process Succeeded:', fake.text, timing());
      return fake;
    },
    stop: () => {
      d('Process Stopped:', fake.text, timing());
      return fake;
    },
    warn: (warning: string) => {
      d('Process Warned:', warning, timing());
      return fake;
    },
    get text() {
      return oraName;
    },
    set text(newName: string) {
      d('Process Renamed:', oraName, ' --> ', newName);
      oraName = newName;
    },
  };
  return fake;
};

export default useFakeOra ? fakeOra : realOra;

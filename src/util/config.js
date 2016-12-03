import fs from 'fs';
import mkdirp from 'mkdirp';
import os from 'os';
import path from 'path';


/*
 * Let's be real sharing config accross spawned process's must be easier than
 * this...
 */
class BasicConfigStore {
  constructor() {
    this._store = {};
    this._dir = path.resolve(os.tmpdir(), 'electron-forge');
    this._path = path.resolve(this._dir, '.runtime.config');
    mkdirp.sync(this._dir);
  }

  get(key) {
    this._load();
    return this._store[key];
  }

  set(key, value) {
    this._load();
    this._store[key] = value;
    fs.writeFileSync(this._path, JSON.stringify(this._store));
  }

  _load() {
    if (fs.existsSync(this._path)) {
      this._store = JSON.parse(fs.readFileSync(this._path, 'utf8'));
    }
  }

  reset() {
    this._store = {};
    fs.writeFileSync(this._path, JSON.stringify(this._store));
  }
}

export default new BasicConfigStore();

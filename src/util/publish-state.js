import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';

const EXTENSION = '.forge.publish';

export default class PublishState {
  static async loadFromDirectory(directory) {
    if (!await fs.exists(directory)) {
      throw new Error(`Attempted to load publish state from a missing directory: ${directory}`);
    }

    const publishes = [];
    for (const dirName of await fs.readdir(directory)) {
      const subDir = path.resolve(directory, dirName);
      const states = [];
      if ((await fs.stat(subDir)).isDirectory()) {
        const filePaths = (await fs.readdir(subDir))
          .filter(fileName => fileName.endsWith(EXTENSION))
          .map(fileName => path.resolve(subDir, fileName));

        for (const filePath of filePaths) {
          const state = new PublishState(filePath);
          await state.load();
          states.push(state);
        }
      }
      publishes.push(states);
    }
    return publishes;
  }

  static async saveToDirectory(directory, artifacts) {
    const id = crypto.createHash('md5').update(JSON.stringify(artifacts)).digest('hex');
    for (const artifact of artifacts) {
      const state = new PublishState(path.resolve(directory, id, 'null'), '', false);
      state.setState({
        paths: Array.from(artifact),
        platform: artifact.platform,
        arch: artifact.arch,
        packageJSON: artifact.packageJSON,
        forgeConfig: artifact.forgeConfig,
      });
      await state.saveToDisk();
    }
  }

  constructor(filePath, hasHash = true) {
    this.dir = path.dirname(filePath);
    this.path = filePath;
    this.hasHash = hasHash;
  }

  generateHash() {
    const content = JSON.stringify(this.state || {});
    return crypto.createHash('md5').update(content).digest('hex');
  }

  setState(state) {
    this.state = state;
  }

  async load() {
    this.state = await fs.readJson(this.path);
  }

  async saveToDisk() {
    if (!this.hasHash) {
      this.path = path.resolve(this.dir, `${this.generateHash()}${EXTENSION}`);
      this.hasHash = true;
    }

    await fs.mkdirs(path.dirname(this.path));
    await fs.writeJson(this.path, this.state);
  }
}

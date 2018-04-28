import { ForgeMakeResult } from '@electron-forge/shared-types';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';

const EXTENSION = '.forge.publish';

export default class PublishState {
  static async loadFromDirectory(directory: string, rootDir: string) {
    if (!await fs.pathExists(directory)) {
      throw new Error(`Attempted to load publish state from a missing directory: ${directory}`);
    }

    const publishes: PublishState[][] = [];
    for (const dirName of await fs.readdir(directory)) {
      const subDir = path.resolve(directory, dirName);
      const states: PublishState[] = [];

      if ((await fs.stat(subDir)).isDirectory()) {
        const filePaths = (await fs.readdir(subDir))
          .filter(fileName => fileName.endsWith(EXTENSION))
          .map(fileName => path.resolve(subDir, fileName));

        for (const filePath of filePaths) {
          const state = new PublishState(filePath);
          await state.load();
          state.state.artifacts = state.state.artifacts.map(artifactPath => path.resolve(rootDir, artifactPath));
          states.push(state);
        }
      }
      publishes.push(states);
    }
    return publishes;
  }

  static async saveToDirectory(directory: string, artifacts: ForgeMakeResult[], rootDir: string) {
    const id = crypto.createHash('SHA256').update(JSON.stringify(artifacts)).digest('hex');
    for (const artifact of artifacts) {
      artifact.artifacts = artifact.artifacts.map(artifactPath => path.relative(rootDir, artifactPath));
      const state = new PublishState(path.resolve(directory, id, 'null'), false);
      state.setState(artifact);
      await state.saveToDisk();
    }
  }

  private dir: string;
  private path: string;
  private hasHash: boolean;
  private state: ForgeMakeResult = {} as any;

  constructor(filePath: string, hasHash = true) {
    this.dir = path.dirname(filePath);
    this.path = filePath;
    this.hasHash = hasHash;
  }

  generateHash() {
    const content = JSON.stringify(this.state || {});
    return crypto.createHash('SHA256').update(content).digest('hex');
  }

  setState(state: ForgeMakeResult) {
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

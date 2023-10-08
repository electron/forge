import { PluginBase } from '@electron-forge/plugin-base';

import { EntryPointPluginConfig } from '../Config';

export default class EntryPointPreloadPlugin extends PluginBase<EntryPointPluginConfig> {
  name = this.config.name;
  apply() {
    // noop
  }
}

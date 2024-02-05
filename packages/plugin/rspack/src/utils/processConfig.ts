import { Configuration } from '@rspack/core';

import { RspackConfigurationFactory } from '../Config';

const trivialConfigurationFactory =
  (config: Configuration): RspackConfigurationFactory =>
  () =>
    config;

export type ConfigProcessor = (config: RspackConfigurationFactory) => Promise<Configuration>;

// Ensure processing logic is run for both `Configuration` and
// `RspackConfigurationFactory` config variants.
const processConfig = async (processor: ConfigProcessor, config: Configuration | RspackConfigurationFactory): Promise<Configuration> => {
  const configFactory = typeof config === 'function' ? config : trivialConfigurationFactory(config);
  return processor(configFactory);
};

export default processConfig;

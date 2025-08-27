import { describe, expect, it } from 'vitest';

import processConfig, { ConfigProcessor } from '../../src/util/processConfig';
import { ConfigurationFactory } from '../../src/WebpackConfig';

const sampleWebpackConfig = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif|webp)$/,
        use: 'file-loader',
      },
    ],
  },
};

const sampleConfigFactoryParams: Parameters<ConfigurationFactory> = [
  {},
  { mode: 'production' },
];

describe('processConfig', () => {
  it('works for object config', async () => {
    let invoked = 0;
    const processor: ConfigProcessor = async (configFactory) => {
      invoked += 1;
      return configFactory(
        sampleConfigFactoryParams[0],
        sampleConfigFactoryParams[1],
      );
    };

    expect(await processConfig(processor, sampleWebpackConfig)).toEqual(
      sampleWebpackConfig,
    );
    expect(invoked).toEqual(1);
  });

  it('works for fn config', async () => {
    let invoked = 0;
    const processor: ConfigProcessor = async (configFactory) => {
      invoked += 1;
      return configFactory(
        sampleConfigFactoryParams[0],
        sampleConfigFactoryParams[1],
      );
    };

    const fnConfig: ConfigurationFactory = (arg0, arg1) => {
      expect(arg0).toEqual(sampleConfigFactoryParams[0]);
      expect(arg1).toEqual(sampleConfigFactoryParams[1]);
      return sampleWebpackConfig;
    };

    expect(await processConfig(processor, fnConfig)).toEqual(
      sampleWebpackConfig,
    );
    expect(invoked).toEqual(1);
  });

  it('works for promise config', async () => {
    let invoked = 0;
    const processor: ConfigProcessor = async (configFactory) => {
      invoked += 1;
      return configFactory(
        sampleConfigFactoryParams[0],
        sampleConfigFactoryParams[1],
      );
    };

    const promiseConfig: ConfigurationFactory = (arg0, arg1) => {
      expect(arg0).toEqual(sampleConfigFactoryParams[0]);
      expect(arg1).toEqual(sampleConfigFactoryParams[1]);
      return sampleWebpackConfig;
    };

    expect(await processConfig(processor, promiseConfig)).toEqual(
      sampleWebpackConfig,
    );
    expect(invoked).toEqual(1);
  });
});

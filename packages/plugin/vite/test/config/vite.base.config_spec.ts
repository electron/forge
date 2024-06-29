import path from 'node:path';

import { expect } from 'chai';
import { default as vite } from 'vite';

import { getBuildDefine, getDefineKeys, pluginExposeRenderer } from '../../src/config/vite.base.config';

import type { VitePluginConfig } from '../../src/Config';

const configRoot = path.join(__dirname, 'fixtures/vite-configs');
const forgeConfig: VitePluginConfig = {
  build: [
    {
      entry: 'src/main.js',
      config: path.join(configRoot, 'vite.main.config.js'),
      target: 'main',
    },
    {
      entry: 'src/preload.js',
      config: path.join(configRoot, 'vite.preload.config.js'),
      target: 'preload',
    },
  ],
  renderer: [
    {
      name: 'main_window',
      config: path.join(configRoot, 'vite.renderer.config.js'),
    },
    {
      name: 'second_window',
      config: path.join(configRoot, 'vite.renderer.config.js'),
    },
  ],
};

describe('vite.base.config', () => {
  it('getDefineKeys', () => {
    const defineKeys1 = getDefineKeys(forgeConfig.renderer.map(({ name }) => name!));
    const defineKeys2 = {
      main_window: {
        VITE_DEV_SERVER_URL: 'MAIN_WINDOW_VITE_DEV_SERVER_URL',
        VITE_NAME: 'MAIN_WINDOW_VITE_NAME',
      },
      second_window: {
        VITE_DEV_SERVER_URL: 'SECOND_WINDOW_VITE_DEV_SERVER_URL',
        VITE_NAME: 'SECOND_WINDOW_VITE_NAME',
      },
    };

    expect(defineKeys1).deep.equal(defineKeys2);
  });

  it('getBuildDefine:build', () => {
    const define1 = getBuildDefine({
      command: 'build',
      mode: 'production',
      root: configRoot,
      forgeConfig,
      forgeConfigSelf: forgeConfig.build.find(({ target }) => target === 'main')!,
    });
    const define2 = {
      MAIN_WINDOW_VITE_DEV_SERVER_URL: undefined,
      MAIN_WINDOW_VITE_NAME: '"main_window"',
      SECOND_WINDOW_VITE_DEV_SERVER_URL: undefined,
      SECOND_WINDOW_VITE_NAME: '"second_window"',
    };

    expect(define1).deep.equal(define2);
  });

  it('getBuildDefine:serve', async () => {
    const server = await vite.createServer({
      publicDir: false,
      plugins: [pluginExposeRenderer('main_window')],
    });
    await server.listen(5173);

    const define1 = getBuildDefine({
      command: 'serve',
      mode: 'development',
      root: configRoot,
      forgeConfig,
      forgeConfigSelf: forgeConfig.renderer.find(({ name }) => name === 'main_window')!,
    });
    const define2 = {
      MAIN_WINDOW_VITE_DEV_SERVER_URL: '"http://localhost:5173"',
      MAIN_WINDOW_VITE_NAME: '"main_window"',
      SECOND_WINDOW_VITE_DEV_SERVER_URL: undefined, // Only one server has been started here.
      SECOND_WINDOW_VITE_NAME: '"second_window"',
    };

    await server.close();

    expect(define1).deep.equal(define2);
  });
});

import path from 'node:path';

import { createServer } from 'vite';
import { describe, expect, it } from 'vitest';

import ViteConfigGenerator from '../../src/ViteConfig';

import type { VitePluginConfig } from '../../src/Config';
import type { AddressInfo } from 'node:net';

const projectDir = path.join(
  import.meta.dirname,
  '..',
  'fixtures',
  'subprocess-build',
);

describe('vite.renderer.config', () => {
  it("keeps serving the dev server from Vite's default base", async () => {
    const forgeConfig: VitePluginConfig = {
      build: [],
      renderer: [
        {
          name: 'main_window',
          config: path.join(projectDir, 'vite.renderer.config.mjs'),
        },
      ],
    };
    // `isProd: false` resolves the config the way `electron-forge start` does.
    const generator = new ViteConfigGenerator(forgeConfig, projectDir, false);
    const rendererConfig = (await generator.getRendererConfig())[0];

    const server = await createServer({
      configFile: false,
      ...rendererConfig,
      // Ephemeral port so this never collides with a concurrent spec.
      server: { port: 0 },
    });

    try {
      await server.listen();
      const addressInfo = server.httpServer?.address() as AddressInfo;
      const response = await fetch(`http://localhost:${addressInfo.port}/`);
      const html = await response.text();

      expect(response.ok).toBe(true);
      // Dropping the relative base leaves the dev server on Vite's default
      // one, so the client and entry URLs stay absolute.
      expect(server.config.base).toEqual('/');
      expect(html).toContain('src="/@vite/client"');
      expect(html).toContain('src="/src/renderer.js"');
    } finally {
      await server.close();
    }
  });
});

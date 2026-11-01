import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { PluginBase } from '@electron-forge/plugin-base';
import {
  ForgeHookFn,
  ForgeHookMap,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import debug from 'debug';

import { IconsPluginConfig } from './Config.js';
import { buildIcns, buildIco, ICNS_TYPES, ICO_SIZES } from './formats.js';
import { decodePng, encodePng, resize } from './png.js';

const d = debug('electron-forge:plugin:icons');

/** Bumped whenever the generated output would change for the same input. */
const GENERATOR_VERSION = '1';

export interface GeneratedIcons {
  icns: string;
  ico: string;
  png: string;
}

/**
 * Generates `icon.icns`, `icon.ico` and `icon.png` from a square PNG.
 * Skips the work when the source and options are unchanged since the last run.
 */
export async function generateIcons(
  sourcePath: string,
  outDir: string,
  linuxSize = 512,
): Promise<GeneratedIcons> {
  const outputs: GeneratedIcons = {
    icns: path.join(outDir, 'icon.icns'),
    ico: path.join(outDir, 'icon.ico'),
    png: path.join(outDir, 'icon.png'),
  };

  const sourceFile = await fs.readFile(sourcePath);
  const fingerprint = createHash('sha256')
    .update(GENERATOR_VERSION)
    .update(String(linuxSize))
    .update(sourceFile)
    .digest('hex');
  const stampPath = path.join(outDir, '.source-hash');

  const stamp = await fs.readFile(stampPath, 'utf-8').catch(() => '');
  if (stamp === fingerprint) {
    const allExist = await Promise.all(
      Object.values(outputs).map((p) =>
        fs.access(p).then(
          () => true,
          () => false,
        ),
      ),
    );
    if (allExist.every(Boolean)) {
      d('icons are up to date, skipping');
      return outputs;
    }
  }

  const source = decodePng(sourceFile);
  if (source.width !== source.height) {
    throw new Error(
      `Icon source must be square, but ${sourcePath} is ${source.width}×${source.height}.`,
    );
  }
  if (source.width < 1024) {
    console.warn(
      `[plugin-icons] ${sourcePath} is ${source.width}×${source.height}. ` +
        'Use a 1024×1024 source for sharp icons on high-density displays.',
    );
  }

  const sizes = new Set<number>([
    ...ICNS_TYPES.map((t) => t.size),
    ...ICO_SIZES,
    linuxSize,
  ]);

  // An area-averaging resize straight from the source already weighs every
  // source pixel, so no multi-step downscale is needed.
  const pngBySize = new Map<number, Buffer>();
  for (const size of sizes) {
    pngBySize.set(size, encodePng(resize(source, size, size)));
  }

  await fs.mkdir(outDir, { recursive: true });
  await Promise.all([
    fs.writeFile(outputs.icns, buildIcns(pngBySize)),
    fs.writeFile(outputs.ico, buildIco(pngBySize)),
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    fs.writeFile(outputs.png, pngBySize.get(linuxSize)!),
  ]);
  await fs.writeFile(stampPath, fingerprint);
  d('generated icons in', outDir);
  return outputs;
}

type MakerEntry = { name?: string; config?: Record<string, unknown> };

export default class IconsPlugin extends PluginBase<IconsPluginConfig> {
  name = 'icons';

  private projectDir = process.cwd();

  private iconDir = '';

  constructor(config: IconsPluginConfig) {
    super(config);
    if (!config || typeof config.source !== 'string') {
      throw new Error(
        'The icons plugin requires a "source" option pointing at a square PNG.',
      );
    }
  }

  init(dir: string, config: ResolvedForgeConfig): void {
    super.init(dir, config);
    this.projectDir = dir;
  }

  getHooks(): ForgeHookMap {
    return {
      resolveForgeConfig: this.resolveForgeConfig,
      generateAssets: this.generateAssets,
    };
  }

  private outputs(): GeneratedIcons {
    return {
      icns: path.join(this.iconDir, 'icon.icns'),
      ico: path.join(this.iconDir, 'icon.ico'),
      png: path.join(this.iconDir, 'icon.png'),
    };
  }

  resolveForgeConfig: ForgeHookFn<'resolveForgeConfig'> = async (
    forgeConfig,
  ) => {
    this.iconDir = path.resolve(
      this.projectDir,
      this.config.outDir ?? path.join(forgeConfig.outDir || 'out', 'icons'),
    );
    const outputs = this.outputs();

    forgeConfig.packagerConfig ??= {};
    if (forgeConfig.packagerConfig.icon) {
      console.warn(
        '[plugin-icons] packagerConfig.icon is set; the icons plugin replaces it with the generated icons.',
      );
    }
    // Packager adds the right extension (.icns / .ico) for each platform.
    forgeConfig.packagerConfig.icon = path.join(this.iconDir, 'icon');

    // Fill in maker icon options the user has not set themselves.
    for (const maker of forgeConfig.makers as MakerEntry[]) {
      if (
        !maker ||
        typeof maker !== 'object' ||
        typeof maker.name !== 'string'
      ) {
        continue;
      }
      if (maker.config !== undefined && typeof maker.config !== 'object') {
        continue;
      }
      maker.config ??= {};
      const config = maker.config;
      switch (maker.name) {
        case '@electron-forge/maker-squirrel':
          config.setupIcon ??= outputs.ico;
          break;
        case '@electron-forge/maker-wix':
          config.icon ??= outputs.ico;
          break;
        case '@electron-forge/maker-dmg':
          config.icon ??= outputs.icns;
          break;
        case '@electron-forge/maker-deb':
        case '@electron-forge/maker-rpm': {
          const options = (config.options ??= {}) as Record<string, unknown>;
          options.icon ??= outputs.png;
          break;
        }
      }
    }

    return forgeConfig;
  };

  generateAssets: ForgeHookFn<'generateAssets'> = async () => {
    await generateIcons(
      path.resolve(this.projectDir, this.config.source),
      this.iconDir ||
        path.resolve(this.projectDir, this.config.outDir ?? 'out/icons'),
      this.config.linuxSize,
    );
  };
}

export { IconsPlugin, IconsPluginConfig };

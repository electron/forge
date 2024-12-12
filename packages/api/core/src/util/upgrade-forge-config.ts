import path from 'node:path';

import { ForgeConfig, ForgePlatform, IForgeResolvableMaker, IForgeResolvablePublisher } from '@electron-forge/shared-types';

import { siblingDep } from '../api/init-scripts/init-npm';

type MakeTargets = { string: string[] };

type GitHub5Config = Record<string, unknown> & {
  name: string;
  owner: string;
  options: Record<string, unknown>;
};

type Forge5Config = {
  make_targets?: Record<ForgePlatform, string[]>;
  electronPackagerConfig?: Record<string, unknown>;
  electronRebuildConfig?: Record<string, unknown>;
  electronWinstallerConfig?: Record<string, unknown>;
  electronInstallerDMG?: Record<string, unknown>;
  electronInstallerFlatpak?: Record<string, unknown>;
  electronInstallerDebian?: Record<string, unknown>;
  electronInstallerRedhat?: Record<string, unknown>;
  electronInstallerSnap?: Record<string, unknown>;
  electronWixMSIConfig?: Record<string, unknown>;
  windowsStoreConfig?: Record<string, unknown>;

  github_repository?: GitHub5Config;
  s3?: Record<string, unknown>;
  'electron-release-server'?: Record<string, unknown>;
  snapStore?: Record<string, unknown>;
};

type Forge5ConfigKey = keyof Forge5Config;

type ForgePackageJSON = Record<string, unknown> & {
  config: {
    forge: ForgeConfig;
  };
  devDependencies: Record<string, string>;
};

function mapMakeTargets(forge5Config: Forge5Config): Map<string, ForgePlatform[]> {
  const makeTargets = new Map<string, ForgePlatform[]>();
  if (forge5Config.make_targets) {
    for (const [platform, targets] of Object.entries(forge5Config.make_targets as MakeTargets)) {
      for (const target of targets) {
        let platforms = makeTargets.get(target);
        if (platforms === undefined) {
          platforms = [];
          makeTargets.set(target, platforms);
        }
        platforms.push(platform as ForgePlatform);
      }
    }
  }

  return makeTargets;
}

const forge5MakerMappings = new Map<Forge5ConfigKey, string>([
  ['electronInstallerDebian', 'deb'],
  ['electronInstallerDMG', 'dmg'],
  ['electronInstallerFlatpak', 'flatpak'],
  ['electronInstallerRedhat', 'rpm'],
  ['electronInstallerSnap', 'snap'],
  ['electronWinstallerConfig', 'squirrel'],
  ['electronWixMSIConfig', 'wix'],
  ['windowsStoreConfig', 'appx'],
]);

/**
 * Converts Forge v5 maker config to v6.
 */
function generateForgeMakerConfig(forge5Config: Forge5Config): IForgeResolvableMaker[] {
  const makeTargets = mapMakeTargets(forge5Config);
  const makers: IForgeResolvableMaker[] = [];

  for (const [forge5Key, makerType] of forge5MakerMappings) {
    const config = forge5Config[forge5Key];
    if (config) {
      makers.push({
        name: `@electron-forge/maker-${makerType}`,
        config: forge5Config[forge5Key],
        platforms: makeTargets.get(makerType) || [],
      } as IForgeResolvableMaker);
    }
  }

  const zipPlatforms = makeTargets.get('zip');
  if (zipPlatforms) {
    makers.push({
      name: '@electron-forge/maker-zip',
      platforms: zipPlatforms,
    } as IForgeResolvableMaker);
  }

  return makers;
}

const forge5PublisherMappings = new Map<Forge5ConfigKey, string>([
  ['github_repository', 'github'],
  ['s3', 's3'],
  ['electron-release-server', 'electron-release-server'],
  ['snapStore', 'snapcraft'],
]);

/**
 * Transforms v5 GitHub publisher config to v6 syntax.
 */
function transformGitHubPublisherConfig(config: GitHub5Config) {
  const { name, owner, options, ...gitHubConfig } = config;
  gitHubConfig.repository = { name, owner };
  if (options) {
    gitHubConfig.octokitOptions = options;
  }

  return gitHubConfig;
}

/**
 * Converts Forge v5 publisher config to v6.
 */
function generateForgePublisherConfig(forge5Config: Forge5Config): IForgeResolvablePublisher[] {
  const publishers: IForgeResolvablePublisher[] = [];

  for (const [forge5Key, publisherType] of forge5PublisherMappings) {
    let config = forge5Config[forge5Key];
    if (config) {
      if (publisherType === 'github') {
        config = transformGitHubPublisherConfig(config as GitHub5Config);
      }
      publishers.push({
        config,
        name: `@electron-forge/publisher-${publisherType}`,
        platforms: null,
      } as IForgeResolvableMaker);
    }
  }

  return publishers;
}

/**
 * Upgrades Forge v5 config to v6.
 */
export default function upgradeForgeConfig(forge5Config: Forge5Config): ForgeConfig {
  const forgeConfig: ForgeConfig = {} as ForgeConfig;

  if (forge5Config.electronPackagerConfig) {
    delete forge5Config.electronPackagerConfig.packageManager;
    forgeConfig.packagerConfig = forge5Config.electronPackagerConfig;
  }
  if (forge5Config.electronRebuildConfig) {
    forgeConfig.rebuildConfig = forge5Config.electronRebuildConfig;
  }
  forgeConfig.makers = generateForgeMakerConfig(forge5Config);
  forgeConfig.publishers = generateForgePublisherConfig(forge5Config);

  return forgeConfig;
}

export function updateUpgradedForgeDevDeps(packageJSON: ForgePackageJSON, devDeps: string[]): string[] {
  const forgeConfig = packageJSON.config.forge;
  devDeps = devDeps.filter((dep) => !dep.startsWith('@electron-forge/maker-'));
  devDeps = devDeps.concat((forgeConfig.makers as IForgeResolvableMaker[]).map((maker: IForgeResolvableMaker) => siblingDep(path.basename(maker.name))));
  devDeps = devDeps.concat(
    (forgeConfig.publishers as IForgeResolvablePublisher[]).map((publisher: IForgeResolvablePublisher) => siblingDep(path.basename(publisher.name)))
  );

  return devDeps;
}

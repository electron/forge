import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  ForgeMakeResult,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChecksumsPlugin } from '../src/ChecksumsPlugin';
import { npmPurl } from '../src/sbom';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

async function writeJson(p: string, value: unknown) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(value));
}

describe('ChecksumsPlugin', () => {
  let tmp: string;
  const forgeConfig = { outDir: 'out' } as ResolvedForgeConfig;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'forge-checksums-'));
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  async function makeArtifact(rel: string, contents: string) {
    const p = path.join(tmp, 'out', 'make', rel);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, contents);
    return p;
  }

  async function makeBuild() {
    const buildPath = path.join(tmp, 'build', 'resources', 'app');
    await writeJson(path.join(buildPath, 'package.json'), {
      name: 'my-app',
      version: '1.0.0',
    });
    await writeJson(
      path.join(buildPath, 'node_modules', 'left-pad', 'package.json'),
      {
        name: 'left-pad',
        version: '1.3.0',
        license: 'WTFPL',
      },
    );
    await writeJson(
      path.join(buildPath, 'node_modules', '@scope', 'pkg', 'package.json'),
      {
        name: '@scope/pkg',
        version: '2.0.0',
        license: { type: 'MIT' },
      },
    );
    await writeJson(
      path.join(
        buildPath,
        'node_modules',
        '@scope',
        'pkg',
        'node_modules',
        'left-pad',
        'package.json',
      ),
      { name: 'left-pad', version: '1.1.0', license: 'MIT OR Apache-2.0' },
    );
    return buildPath;
  }

  function createPlugin(config = {}) {
    const plugin = new ChecksumsPlugin(config);
    plugin.init(tmp, forgeConfig);
    return plugin;
  }

  it('writes a sha256sum-compatible file and an SBOM per platform and arch', async () => {
    const plugin = createPlugin();
    const hooks = plugin.getHooks();
    const buildPath = await makeBuild();
    await hooks.packageAfterPrune!(
      forgeConfig,
      buildPath,
      '40.0.0',
      'darwin',
      'arm64',
    );

    const zip = await makeArtifact('zip/darwin/arm64/my-app-1.0.0.zip', 'zip');
    const dmg = await makeArtifact('my-app-1.0.0-arm64.dmg', 'dmg');
    const packageJSON = { name: 'my-app', version: '1.0.0' };
    const results: ForgeMakeResult[] = [
      {
        artifacts: [zip],
        packageJSON,
        platform: 'darwin',
        arch: 'arm64',
        maker: 'zip',
      },
      {
        artifacts: [dmg],
        packageJSON,
        platform: 'darwin',
        arch: 'arm64',
        maker: 'dmg',
      },
    ];

    const out = (await hooks.postMake!(
      forgeConfig,
      results,
    )) as ForgeMakeResult[];
    expect(out).toHaveLength(3);
    const added = out[2];
    expect(added).toMatchObject({
      platform: 'darwin',
      arch: 'arm64',
      maker: 'checksums',
    });

    const [sbomPath, sumsPath] = added.artifacts;
    expect(path.basename(sumsPath)).toEqual('SHA256SUMS-darwin-arm64.txt');
    expect(path.basename(sbomPath)).toEqual(
      'my-app-1.0.0-darwin-arm64.cdx.json',
    );

    const sums = await fs.readFile(sumsPath, 'utf-8');
    const sbomText = await fs.readFile(sbomPath, 'utf-8');
    expect(sums).toEqual(
      [
        `${sha256('dmg')}  my-app-1.0.0-arm64.dmg`,
        `${sha256(sbomText)}  my-app-1.0.0-darwin-arm64.cdx.json`,
        `${sha256('zip')}  my-app-1.0.0.zip`,
      ].join('\n') + '\n',
    );

    const sbom = JSON.parse(sbomText);
    expect(sbom.bomFormat).toEqual('CycloneDX');
    expect(sbom.specVersion).toEqual('1.5');
    expect(sbom.metadata.component).toMatchObject({
      name: 'my-app',
      version: '1.0.0',
    });
    expect(sbom.components.map((c: { purl: string }) => c.purl)).toEqual([
      npmPurl('electron', '40.0.0'),
      'pkg:npm/%40scope/pkg@2.0.0',
      'pkg:npm/left-pad@1.1.0',
      'pkg:npm/left-pad@1.3.0',
    ]);
    expect(sbom.components[1].licenses).toEqual([{ expression: 'MIT' }]);
    expect(sbom.components[2].licenses).toEqual([
      { expression: 'MIT OR Apache-2.0' },
    ]);
  });

  it('supports sha512 and turning the SBOM off', async () => {
    const plugin = createPlugin({ algorithm: 'sha512', sbom: false });
    const zip = await makeArtifact('app.zip', 'zip');
    const out = (await plugin.getHooks().postMake!(forgeConfig, [
      { artifacts: [zip], packageJSON: {}, platform: 'linux', arch: 'x64' },
    ])) as ForgeMakeResult[];
    expect(out[1].artifacts).toHaveLength(1);
    expect(path.basename(out[1].artifacts[0])).toEqual(
      'SHA512SUMS-linux-x64.txt',
    );
    const sums = await fs.readFile(out[1].artifacts[0], 'utf-8');
    expect(sums).toEqual(
      `${createHash('sha512').update('zip').digest('hex')}  app.zip\n`,
    );
  });

  it('uses relative paths when two artifacts share a file name', async () => {
    const plugin = createPlugin({ sbom: false });
    const a = await makeArtifact('squirrel.windows/x64/RELEASES', 'a');
    const b = await makeArtifact('other/x64/RELEASES', 'b');
    const out = (await plugin.getHooks().postMake!(forgeConfig, [
      { artifacts: [a, b], packageJSON: {}, platform: 'win32', arch: 'x64' },
    ])) as ForgeMakeResult[];
    const sums = await fs.readFile(out[1].artifacts[0], 'utf-8');
    expect(sums).toContain('  other/x64/RELEASES');
    expect(sums).toContain('  squirrel.windows/x64/RELEASES');
  });

  it('falls back to any build of the platform for universal macOS results', async () => {
    const plugin = createPlugin();
    const hooks = plugin.getHooks();
    await hooks.packageAfterPrune!(
      forgeConfig,
      await makeBuild(),
      '40.0.0',
      'darwin',
      'x64',
    );
    const zip = await makeArtifact('app.zip', 'zip');
    const out = (await hooks.postMake!(forgeConfig, [
      {
        artifacts: [zip],
        packageJSON: { name: 'my-app', version: '1.0.0' },
        platform: 'darwin',
        arch: 'universal',
      },
    ])) as ForgeMakeResult[];
    expect(out[1].artifacts.map((a) => path.basename(a))).toEqual([
      'my-app-1.0.0-darwin-universal.cdx.json',
      'SHA256SUMS-darwin-universal.txt',
    ]);
  });
});

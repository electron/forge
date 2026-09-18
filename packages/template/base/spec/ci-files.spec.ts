import fs from 'node:fs';
import path from 'node:path';

import { PMDetails, resolvePackageManager } from '@electron-forge/core-utils';
import { describe, expect, it } from 'vitest';

import {
  CI_WORKFLOW_FILES,
  installCommands,
  renderWorkflow,
  runScriptCommand,
} from '../src/ci-files';

const workflowsDir = path.resolve(
  import.meta.dirname,
  '../tmpl/_github/workflows',
);

describe('ci-files', () => {
  const pm = (spec: string) => resolvePackageManager(spec);

  describe('installCommands', () => {
    it.each<[string, string[]]>([
      ['npm@latest', ['npm ci']],
      ['pnpm@latest', ['corepack enable', 'pnpm install --frozen-lockfile']],
      ['yarn@latest', ['corepack enable', 'yarn install --immutable']],
      ['yarn@4.10.3', ['corepack enable', 'yarn install --immutable']],
      ['yarn@1', ['corepack enable', 'yarn install --frozen-lockfile']],
      ['yarn@1.22.22', ['corepack enable', 'yarn install --frozen-lockfile']],
    ])('%s', async (spec, expected) => {
      expect(installCommands(await pm(spec))).toEqual(expected);
    });
  });

  describe('runScriptCommand', () => {
    it.each<[string, string, string | undefined, string]>([
      ['npm@latest', 'make', undefined, 'npm run make'],
      ['npm@latest', 'release', '--dry-run', 'npm run release -- --dry-run'],
      ['pnpm@latest', 'make', undefined, 'pnpm make'],
      ['pnpm@latest', 'release', '--dry-run', 'pnpm release --dry-run'],
      ['yarn@latest', 'make', undefined, 'yarn make'],
      ['yarn@1', 'release', '--from-dry-run', 'yarn release --from-dry-run'],
    ])('%s: %s %s', async (spec, script, args, expected) => {
      expect(runScriptCommand(await pm(spec), script, args)).toEqual(expected);
    });
  });

  describe('renderWorkflow', () => {
    it('inlines a single install command', async () => {
      expect(
        renderWorkflow('      - run: __FORGE_PM_INSTALL__\n', await pm('npm')),
      ).toEqual('      - run: npm ci\n');
    });

    it('renders multiple install commands as a block scalar in a list item', async () => {
      expect(
        renderWorkflow('      - run: __FORGE_PM_INSTALL__', await pm('yarn')),
      ).toEqual(
        [
          '      - run: |',
          '          corepack enable',
          '          yarn install --immutable',
        ].join('\n'),
      );
    });

    it('renders multiple install commands as a block scalar', async () => {
      expect(
        renderWorkflow('        run: __FORGE_PM_INSTALL__', await pm('pnpm')),
      ).toEqual(
        [
          '        run: |',
          '          corepack enable',
          '          pnpm install --frozen-lockfile',
        ].join('\n'),
      );
    });

    it('renders script commands with their arguments', async () => {
      expect(
        renderWorkflow(
          'run: __FORGE_PM_RUN__ release --dry-run',
          await pm('npm'),
        ),
      ).toEqual('run: npm run release -- --dry-run');
    });

    it('leaves lines without placeholders alone', async () => {
      const source = 'name: Build\n\non:\n  pull_request:\n';
      expect(renderWorkflow(source, await pm('yarn'))).toEqual(source);
    });
  });

  describe('workflow templates', () => {
    const packageManagers = [
      'npm@latest',
      'pnpm@latest',
      'yarn@latest',
      'yarn@1',
    ];
    const cases = CI_WORKFLOW_FILES.flatMap((file) =>
      packageManagers.map((spec): [string, string] => [file, spec]),
    );

    it.each(cases)(
      '%s renders for %s with no placeholders left',
      async (file, spec) => {
        const source = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
        const rendered = renderWorkflow(source, await pm(spec));
        expect(rendered).not.toContain('__FORGE_PM_');
        expect(rendered).toContain('actions/checkout@');
      },
    );

    it('release.yml runs a dry run and then publishes from it', async () => {
      const source = fs.readFileSync(
        path.join(workflowsDir, 'release.yml'),
        'utf8',
      );
      const rendered = renderWorkflow(source, await pm('npm'));
      expect(rendered).toContain('run: npm run release -- --dry-run');
      expect(rendered).toContain('run: npm run release -- --from-dry-run');
      expect(rendered).toContain('GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
    });

    it('build.yml runs make', async () => {
      const source = fs.readFileSync(
        path.join(workflowsDir, 'build.yml'),
        'utf8',
      );
      const rendered: string = renderWorkflow(source, await pm('yarn'));
      expect(rendered).toContain('run: yarn make');
    });
  });

  it('uses the same commands for an explicitly resolved package manager', async () => {
    const npm: PMDetails = await pm('npm@11');
    expect(installCommands(npm)).toEqual(['npm ci']);
  });
});

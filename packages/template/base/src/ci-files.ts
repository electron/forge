import { PMDetails } from '@electron-forge/core-utils';
import semver from 'semver';

/**
 * GitHub Actions workflows shipped with the base template, relative to
 * `tmpl/_github/workflows`. They are copied to `.github/workflows` in the
 * initialized project when `copyCIFiles` is set.
 */
export const CI_WORKFLOW_FILES = ['build.yml', 'release.yml'];

/**
 * Yarn 2+ (Berry) and Yarn 1 (Classic) spell their lockfile-enforcing install
 * flags differently.
 */
function isYarnBerry(pm: PMDetails): boolean {
  if (pm.executable !== 'yarn') return false;
  if (!pm.version || pm.version === 'latest') return true;
  const version = semver.coerce(pm.version);
  return version ? semver.gte(version, '2.0.0') : true;
}

/**
 * The shell commands that install the project's dependencies in CI for the
 * given package manager, one per line.
 */
export function installCommands(pm: PMDetails): string[] {
  switch (pm.executable) {
    case 'npm':
      return ['npm ci'];
    case 'pnpm':
      // Corepack reads the `packageManager` field that `init` writes to
      // package.json and provisions the matching pnpm/Yarn release.
      return ['corepack enable', 'pnpm install --frozen-lockfile'];
    case 'yarn':
      return [
        'corepack enable',
        isYarnBerry(pm)
          ? 'yarn install --immutable'
          : 'yarn install --frozen-lockfile',
      ];
  }
}

/**
 * The shell command that runs a package.json script with the given package
 * manager, forwarding any extra arguments to the script.
 */
export function runScriptCommand(
  pm: PMDetails,
  script: string,
  args?: string,
): string {
  const suffix = args ? ` ${args}` : '';
  switch (pm.executable) {
    case 'npm':
      return `npm run ${script}${args ? ` --${suffix}` : ''}`;
    case 'pnpm':
    case 'yarn':
      return `${pm.executable} ${script}${suffix}`;
  }
}

/**
 * Fills in the package-manager-specific parts of a workflow template.
 *
 * Templates use two placeholders:
 *
 * - `run: __FORGE_PM_INSTALL__` is replaced by the install command(s), as a
 *   block scalar when more than one command is needed;
 * - `__FORGE_PM_RUN__ <script> [args]` is replaced by the command that runs
 *   that package.json script.
 */
export function renderWorkflow(source: string, pm: PMDetails): string {
  return source
    .split('\n')
    .flatMap((line) => {
      const install = /^(\s*(?:- )?)run: __FORGE_PM_INSTALL__$/.exec(line);
      if (install) {
        const prefix = install[1];
        const commands = installCommands(pm);
        if (commands.length === 1) {
          return [`${prefix}run: ${commands[0]}`];
        }
        // Block scalar lines are indented past the `run` key.
        const indent = ' '.repeat(prefix.length + 2);
        return [
          `${prefix}run: |`,
          ...commands.map((command) => `${indent}${command}`),
        ];
      }
      return [
        line.replace(
          /__FORGE_PM_RUN__ (\S+)(?: (.+))?$/,
          (_match, script: string, args: string | undefined) =>
            runScriptCommand(pm, script, args),
        ),
      ];
    })
    .join('\n');
}

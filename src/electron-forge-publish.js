import 'colors';
import fs from 'fs-promise';
import path from 'path';
import program from 'commander';
import ora from 'ora';

import './util/terminate';
import getForgeConfig from './util/forge-config';
import readPackageJSON from './util/read-package-json';
import requireSearch from './util/require-search';
import resolveDir from './util/resolve-dir';

import make from './electron-forge-make';

const main = async () => {
  const makeResults = await make();

  let dir = process.cwd();
  program
    .version(require('../package.json').version)
    .arguments('[cwd]')
    .option('--auth-token', 'Authorization token for your publisher target (if required)')
    .option('-t, --tag', 'The tag to publish to on GitHub')
    .option('--target', 'The deployment target, defaults to "github"')
    .allowUnknownOption(true)
    .action((cwd) => {
      if (!cwd) return;
      if (path.isAbsolute(cwd) && fs.existsSync(cwd)) {
        dir = cwd;
      } else if (fs.existsSync(path.resolve(dir, cwd))) {
        dir = path.resolve(dir, cwd);
      }
    })
    .parse(process.argv);

  dir = await resolveDir(dir);
  if (!dir) {
    console.error('Failed to locate publishable Electron application'.red);
    if (global._resolveError) global._resolveError();
    process.exit(1);
  }

  const artifacts = makeResults.reduce((accum, arr) => {
    accum.push(...arr);
    return accum;
  }, []);

  const packageJSON = await readPackageJSON(dir);

  const forgeConfig = await getForgeConfig(dir);

  if (!program.target) program.target = 'github';

  const targetSpinner = ora.ora(`Resolving publish target: ${`${program.target}`.cyan}`).start();

  const publisher = requireSearch(__dirname, [
    `./publishers/${program.target}.js`,
    `electron-forge-publisher-${program.target}`,
  ]);
  if (!publisher) {
    targetSpinner.fail();
    throw new Error(`Could not find a publish target with the name: ${program.target}`);
  }
  targetSpinner.succeed();

  await publisher(artifacts, packageJSON, forgeConfig, program.authToken, program.tag);
};

main();

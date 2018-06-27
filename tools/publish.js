require('colors');
const childProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const spawnPromise = require('cross-spawn-promise');
const Listr = require('listr');

const BASE_DIR = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.resolve(BASE_DIR, 'packages');

const publisher = new Listr([
  {
    title: 'Checking working directory',
    task: async () => {
      if (childProcess.execSync('git status -s', {
        cwd: BASE_DIR,
      }).toString() !== '') {
        throw new Error('Your working directory is not clean, please ensure you have a clean working directory before publishing'.red);
      }
    },
  },
  {
    title: 'Building all packages',
    task: () => spawnPromise('bolt', ['build'], {
      cwd: BASE_DIR,
    }),
  },
  {
    title: 'Fetching README\'s',
    task: require('./sync-readmes'),
  },
  {
    title: 'Collecting directories to publish',
    task: async (ctx) => {
      ctx.dirsToPublish = [];
      for (const subDir of await fs.readdir(PACKAGES_DIR)) {
        for (const packageDir of await fs.readdir(path.resolve(PACKAGES_DIR, subDir))) {
          ctx.dirsToPublish.push(path.resolve(PACKAGES_DIR, subDir, packageDir));
        }
      }
    },
  },
  {
    title: 'Publishing all packages',
    task: async (ctx) => {
      return new Listr(await Promise.all(ctx.dirsToPublish.map(async (dir) => {
        const { name, version } = await fs.readJson(path.resolve(dir, 'package.json'));
        const isBeta = version.includes('beta');
        return {
          title: `Publishing: ${`${name}@${version}`.cyan} (beta=${isBeta ? 'true'.green : 'red'.red})`,
          task: async () => {
            try {
              await spawnPromise('npm', ['publish', `--access=public${isBeta ? ' --tag=beta' : ''}`], {
                cwd: dir,
              });
            } catch (err) {
              throw new Error(`Failed to publish ${`${name}@${version}`.cyan} \n${err.stderr.toString()}`);
            }
          },
        };
      })), { concurrent: 5, exitOnError: false });
    },
  },
]);

publisher.run().catch((err) => {
  console.error(err);
  process.exit(1);
});

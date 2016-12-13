import { exec } from 'child_process';
import semver from 'semver';

export default async () =>
  new Promise((resolve) => {
    exec('git --version', (err) => {
      if (err) return resolve(false);
      resolve(true);
    });
  })
  .then(prev => Promise.resolve(prev && semver.gt(process.versions.node, '6.0.0')));

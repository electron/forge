import { spawnSync } from 'child_process';
import { default as Sudoer } from 'electron-sudo';

const which = async (type, prog, promise) => {
  if (spawnSync('which', [prog]).status === 0) {
    await promise;
  } else {
    throw new Error(`${prog} is required to install ${type} packages`);
  }
};

export const sudo = (type, prog, args) =>
  new Promise((resolve, reject) => {
    const sudoer = new Sudoer({ name: 'Electron Forge' });

    which(type, prog, sudoer.spawn(`${prog} ${args}`)
      .then((child) => {
        child.on('exit', async (code) => {
          if (code !== 0) {
            console.error(child.output.stdout.toString('utf8').red);
            console.error(child.output.stderr.toString('utf8').red);
            return reject(new Error(`${prog} failed with status code ${code}`));
          }
          resolve();
        });
      }));
  });

export default which;

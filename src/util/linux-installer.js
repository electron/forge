import { spawnSync } from 'child_process';
import { default as Sudoer } from 'electron-sudo';

async function which(type, prog, promise) {
  if (spawnSync('which', [prog]).status === 0) {
    await promise;
  } else {
    throw new Error(`${prog} is required to install ${type} packages`);
  }
}

async function sudo(type, prog, args) {
  const sudoer = new Sudoer({ name: 'Electron Forge' });
  which(type, prog, sudoer.spawn(`${prog} ${args}`).then((child) => {
    child.on('exit', async (code) => {
      if (code !== 0) {
        console.error(child.output.stdout.toString('utf8'));
        console.error(child.output.stderr.toString('utf8'));
        throw new Error(`${prog} failed with status code ${code}`);
      }
    });
  }));
}

export { which as default, sudo };

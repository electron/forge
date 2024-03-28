import { exec } from 'child_process';

export async function getForgeVersion(): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    exec('npm show @electron-forge/cli version', (err, output) => (err ? resolve(null) : resolve(output.toString().trim())));
  });
}

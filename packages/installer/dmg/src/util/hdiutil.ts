import { spawn } from '@malept/cross-spawn-promise';
import debug from 'debug';

const d = debug('electron-forge:hdiutil');

export interface Mount {
  mountPath: string;
  imagePath: string;
}

export const getMountedImages = async (): Promise<Mount[]> => {
  const output = await spawn('hdiutil', ['info']);
  const mounts = output.toString().split(/====\n/g);
  mounts.shift();

  const mountObjects = [];

  for (const mount of mounts) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const mountPath = /\/Volumes\/(.+)\n/g.exec(mount)![1];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const imagePath = /image-path +: +(.+)\n/g.exec(mount)![1];
      mountObjects.push({ mountPath, imagePath });
    } catch {
      // Ignore
    }
  }

  d('identified active mounts', mountObjects);
  return mountObjects;
};

export const mountImage = async (filePath: string): Promise<Mount> => {
  d('mounting image:', filePath);
  const output = await spawn('hdiutil', ['attach', '-noautoopen', '-nobrowse', '-noverify', filePath]);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const mountPath = /\/Volumes\/(.+)\n/g.exec(output.toString())![1];
  d('mounted at:', mountPath);

  return {
    mountPath,
    imagePath: filePath,
  };
};

export const unmountImage = async (mount: Mount): Promise<void> => {
  d('unmounting current mount:', mount);
  await spawn('hdiutil', ['unmount', '-force', `/Volumes/${mount.mountPath}`]);
};

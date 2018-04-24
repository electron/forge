import spawnPromise from 'cross-spawn-promise';
import debug from 'debug';

const d = debug('electron-forge:hdiutil');

export interface Mount {
  mountPath: string;
  imagePath: string;
}

export const getMountedImages = async (): Promise<Mount[]> => {
  const output = await spawnPromise('hdiutil', ['info']);
  const mounts = output.toString().split(/====\n/g);
  mounts.shift();

  const mountObjects = [];

  for (const mount of mounts) {
    try {
      const mountPath = /\/Volumes\/(.+)\n/g.exec(mount)![1];
      const imagePath = /image-path +: +(.+)\n/g.exec(mount)![1];
      mountObjects.push({ mountPath, imagePath });
    } catch (err) {
      // Ignore
    }
  }

  d('identified active mounts', mountObjects);
  return mountObjects;
};

export const mountImage = async (filePath: string): Promise<Mount> => {
  d('mounting image:', filePath);
  const output = await spawnPromise('hdiutil', ['attach', '-noautoopen', '-nobrowse', '-noverify', filePath]);
  const mountPath = /\/Volumes\/(.+)\n/g.exec(output.toString())![1];
  d('mounted at:', mountPath);

  return {
    mountPath,
    imagePath: filePath,
  };
};

export const unmountImage = async (mount: Mount) => {
  d('unmounting current mount:', mount);
  await spawnPromise('hdiutil', ['unmount', '-force', `/Volumes/${mount.mountPath}`]);
};

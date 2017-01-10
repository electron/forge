import { spawnPromise } from 'spawn-rx';
import debug from 'debug';

const d = debug('electron-forge:hdiutil');

export const getMountedImages = async () => {
  const output = await spawnPromise('hdiutil', ['info']);
  const mounts = output.split(/====\n/g);
  mounts.shift();

  const mountObjects = [];

  for (const mount of mounts) {
    try {
      const mountPath = /\/Volumes\/(.+)\n/g.exec(mount)[1];
      const imagePath = /image-path +: +(.+)\n/g.exec(mount)[1];
      mountObjects.push({ mountPath, imagePath });
    } catch (err) {
      // Ignore
    }
  }

  d('identified active mounts', mountObjects);
  return mountObjects;
};

export const mountImage = async (filePath) => {
  d('mounting image:', filePath);
  const output = await spawnPromise('hdiutil', ['attach', '-noautoopen', '-nobrowse', '-noverify', filePath]);
  const mountPath = /\/Volumes\/(.+)\n/g.exec(output)[1];
  d('mounted at:', mountPath);

  return {
    mountPath,
    iamgePath: filePath,
  };
};

export const unmountImage = async (mount) => {
  d('unmounting current mount:', mount);
  await spawnPromise('hdiutil', ['unmount', '-force', `/Volumes/${mount.mountPath}`]);
};

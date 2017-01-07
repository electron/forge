import rebuild from 'electron-rebuild';

export default (buildPath, electronVersion, platform, arch) => rebuild(buildPath, electronVersion, arch);

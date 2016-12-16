module.exports = {
  make_targets: {
    win32: ['squirrel'],
    darwin: ['zip'],
    linux: ['deb', 'rpm'],
    mas: ['zip'],
  },
  electronPackagerConfig: { foo: 'bar' },
  electronWinstallerConfig: {},
  electronInstallerDebian: {},
  electronInstallerRedhat: {},
  magicFn: () => 'magic result',
};

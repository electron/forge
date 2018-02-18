module.exports = {
  make_targets: {
    win32: ['squirrel', 'appx'],
    darwin: ['zip'],
    linux: ['deb', 'rpm'],
    mas: ['zip'],
  },
  electronPackagerConfig: { foo: 'bar', baz: {} },
  electronWinstallerConfig: {},
  electronInstallerDebian: {},
  electronInstallerRedhat: {},
  magicFn: () => 'magic result',
};

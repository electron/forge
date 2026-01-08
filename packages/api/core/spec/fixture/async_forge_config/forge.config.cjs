module.exports = async function () {
  return {
    packagerConfig: { foo: {} },
    rebuildConfig: {},
    makers: [
      {
        name: '@electron-forge/maker-zip',
        platforms: ['darwin'],
      },
    ],
  };
};

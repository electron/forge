export default async function () {
  return {
    buildIdentifier: 'async-esm',
    packagerConfig: { asyncEsm: true },
    rebuildConfig: {},
    makers: [
      {
        name: '@electron-forge/maker-zip',
        platforms: ['darwin'],
      },
    ],
  };
}

const getElectronVersion = (packageJSON) => {
  const electronVersion = packageJSON.devDependencies['electron-prebuilt-compile'];
  return electronVersion;
};

export default getElectronVersion;

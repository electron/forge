export default (packageJSON: any) => {
  if (!packageJSON.devDependencies) return null;
  return (packageJSON.devDependencies['electron-prebuilt-compile']
      || packageJSON.devDependencies['electron-prebuilt']
      || packageJSON.devDependencies.electron);
};
